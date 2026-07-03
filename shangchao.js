(function () {
  const PLUGIN_ID = "shangchao-plugin";
  const APP_ID = "shangchao-home";
  const STORAGE_KEY = "shangchao_state_v1.1";

  const BOOK_ICON_SVG = "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3F%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22128%22%20height%3D%22128%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239c2a3a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M4%2019.5A2.5%202.5%200%200%201%206.5%2017H20%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M6.5%202H20v20H6.5A2.5%202.5%200%200%201%204%2019.5v-15A2.5%202.5%200%200%201%206.5%202z%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M9%206h7%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M9%2010h7%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M9%2014h5%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E";

  const defaultState = {
    dynasty: {
      stateName: "大昭",
      eraName: "景和",
      userTitle: "朕"
    },
    roles: {}, // charId -> { type: 'harem'|'court'|null, rank: string, background: string, npcs: Array }
    sessions: [], // Array of { id, charId, type: 'stay'|'talk', messages: Array }
    activeTab: "state", // state / sessions / archives
    subPage: "dashboard", // 用于在“国事”标签下的二级子页面路由
    activeSessionId: null,
    selectedCharId: null,
    examQuestion: "今水旱不均，国库渐虚，何策可使百姓丰登、朝廷殷实？",
    examAnswers: {},
    draftSpeech: "",
    currentPetition: null,
    petitionResult: ""
  };

  let uiListeners = [];
  let currentContainer = null;

  function parseJSON(text, fallback) {
    try {
      const clean = text.replace(/```json/gi, "").replace(/```/gi, "").trim();
      return JSON.parse(clean);
    } catch (e) {
      console.error("JSON 解析失败:", e, text);
      return fallback;
    }
  }

  const haremRanks = ["皇后", "贵妃", "贤妃", "淑妃", "德妃", "婕妤", "贵人", "美人", "常在", "答应"];
  const courtRanks = ["首辅", "大学士", "尚书", "侍郎", "御史中丞", "大理寺卿", "知府", "翰林学士"];

  window.RochePlugin.register({
    id: PLUGIN_ID,
    name: "上朝！",
    version: "1.1.0",
    apps: [
      {
        id: APP_ID,
        name: "上朝！",
        icon: "",
        iconImage: BOOK_ICON_SVG, // 注入线装书本 SVG
        async mount(container, roche) {
          currentContainer = container;

          let savedState = {};
          try {
            savedState = (await roche.storage.get(STORAGE_KEY)) || {};
          } catch (e) {
            console.error("加载持久化数据失败:", e);
          }

          const state = { ...defaultState, ...savedState };
          state.dynasty = { ...defaultState.dynasty, ...savedState.dynasty };

          // 注入现代化简约国风 CSS 样式
          const styleEl = document.createElement("style");
          styleEl.id = "shangchao-plugin-css";
          styleEl.innerHTML = `
            .roche-plugin-shangchao {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", sans-serif;
              background-color: #fafafa;
              color: #2c2c2c;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
            }
            .roche-plugin-shangchao * {
              box-sizing: border-box;
            }
            /* App 壳结构 */
            .sc-shell {
              flex: 1;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              position: relative;
            }
            /* 内容主区域 */
            .sc-main-view {
              flex: 1;
              overflow-y: auto;
              padding: 24px;
              padding-bottom: 90px; /* 避开底部 Dock */
            }
            /* 模块卡片 */
            .sc-card {
              background: #ffffff;
              border: 1px solid #ededed;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 16px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
              transition: all 0.2s ease;
            }
            .sc-card:hover {
              border-color: #9c2a3a;
              box-shadow: 0 6px 18px rgba(156, 42, 58, 0.05);
            }
            /* 现代风格长文本容器/边框 */
            .sc-info-card {
              border: 1px solid #e2e2e2;
              background-color: #f7f7f7;
              border-radius: 6px;
              padding: 14px 18px;
              margin: 12px 0;
              font-size: 13.5px;
              color: #3c3c3c;
              line-height: 1.6;
              border-left: 3px solid #9c2a3a; /* 左侧优雅红色装饰条 */
            }
            .sc-info-tag {
              font-size: 11px;
              color: #9c2a3a;
              font-weight: bold;
              letter-spacing: 1px;
              margin-bottom: 6px;
              text-transform: uppercase;
              border-bottom: 1px dashed #e2e2e2;
              padding-bottom: 4px;
            }
            /* 底部现代化 Dock 导航栏 */
            .sc-dock {
              position: absolute;
              bottom: 16px;
              left: 50%;
              transform: translateX(-50%);
              width: 90%;
              max-width: 500px;
              height: 60px;
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border: 1px solid #e0e0e0;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
              border-radius: 30px;
              display: flex;
              align-items: center;
              justify-content: space-around;
              padding: 0 16px;
              z-index: 99;
            }
            .sc-dock-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              color: #777777;
              font-size: 12px;
              transition: all 0.2s;
              flex: 1;
              height: 100%;
            }
            .sc-dock-item:hover {
              color: #9c2a3a;
            }
            .sc-dock-item.active {
              color: #9c2a3a;
              font-weight: bold;
            }
            .sc-dock-icon {
              width: 20px;
              height: 20px;
              margin-bottom: 3px;
              stroke: currentColor;
            }
            /* 极简国风标题栏 */
            .sc-page-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 24px;
              padding-bottom: 12px;
              border-bottom: 1px solid #ededed;
            }
            .sc-title {
              font-size: 22px;
              color: #1a1a1a;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .sc-title span {
              font-size: 13px;
              background: #9c2a3a;
              color: #ffffff;
              padding: 2px 8px;
              border-radius: 4px;
              font-weight: normal;
            }
            /* 输入控件 */
            .sc-input, .sc-textarea, .sc-select {
              width: 100%;
              background: #ffffff;
              border: 1px solid #dcdcdc;
              border-radius: 6px;
              padding: 10px 14px;
              font-size: 14px;
              outline: none;
              color: #2c2c2c;
              transition: border-color 0.15s;
            }
            .sc-input:focus, .sc-textarea:focus, .sc-select:focus {
              border-color: #9c2a3a;
            }
            /* 按钮 */
            .sc-btn {
              background: #9c2a3a;
              color: #ffffff;
              border: none;
              padding: 10px 18px;
              font-size: 14px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: background 0.2s;
            }
            .sc-btn:hover {
              background: #b53849;
            }
            .sc-btn-secondary {
              background: #f0f0f0;
              color: #444;
              border: none;
              padding: 10px 18px;
              font-size: 14px;
              border-radius: 6px;
              cursor: pointer;
              transition: background 0.2s;
            }
            .sc-btn-secondary:hover {
              background: #e4e4e4;
            }
            /* 列表组 */
            .sc-item-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 14px 16px;
              background: #ffffff;
              border: 1px solid #ededed;
              border-radius: 6px;
              margin-bottom: 10px;
            }
            /* 双栏对话布局 */
            .sc-chat-grid {
              display: grid;
              grid-template-columns: 280px 1fr;
              gap: 20px;
              height: 550px;
            }
            .sc-chat-aside {
              border-right: 1px solid #ededed;
              padding-right: 16px;
              overflow-y: auto;
            }
            .sc-chat-room {
              display: flex;
              flex-direction: column;
              height: 100%;
              background: #ffffff;
              border: 1px solid #ededed;
              border-radius: 8px;
              overflow: hidden;
            }
            .sc-chat-history {
              flex: 1;
              overflow-y: auto;
              padding: 16px;
              display: flex;
              flex-direction: column;
              gap: 12px;
              background: #fafafa;
            }
            .sc-chat-msg {
              max-width: 75%;
              padding: 10px 14px;
              border-radius: 8px;
              font-size: 14px;
              line-height: 1.5;
            }
            .sc-chat-msg.sys {
              align-self: center;
              background: #eaeaea;
              color: #666;
              font-size: 11px;
              border-radius: 4px;
              padding: 4px 10px;
              max-width: 90%;
            }
            .sc-chat-msg.user {
              align-self: flex-end;
              background: #9c2a3a;
              color: #ffffff;
            }
            .sc-chat-msg.assistant {
              align-self: flex-start;
              background: #ffffff;
              color: #2c2c2c;
              border: 1px solid #ededed;
            }
            .sc-chat-input-area {
              display: flex;
              padding: 12px;
              gap: 10px;
              border-top: 1px solid #ededed;
              background: #ffffff;
            }
            .sc-back-action {
              display: inline-flex;
              align-items: center;
              cursor: pointer;
              color: #9c2a3a;
              font-size: 13.5px;
              font-weight: 500;
              gap: 4px;
              margin-bottom: 16px;
            }
          `;
          container.appendChild(styleEl);

          const rootEl = document.createElement("div");
          rootEl.className = "roche-plugin-shangchao";
          container.appendChild(rootEl);

          async function updateState(patch) {
            Object.assign(state, patch);
            try {
              await roche.storage.set(STORAGE_KEY, state);
            } catch (e) {
              console.error("保存持久化数据失败:", e);
            }
            await render();
          }

          const onClick = async (e) => {
            const target = e.target;
            const action = target.getAttribute("data-action") || target.closest("[data-action]")?.getAttribute("data-action");
            const argId = target.getAttribute("data-id") || target.closest("[data-id]")?.getAttribute("data-id");

            if (!action) return;

            // 1. Dock 切换标签
            if (action === "switch-tab") {
              await updateState({ activeTab: argId, subPage: "dashboard", draftSpeech: "", petitionResult: "" });
              return;
            }

            // 2. 局部导航
            if (action === "go-sub") {
              await updateState({ subPage: argId, draftSpeech: "", petitionResult: "" });
              return;
            }
            if (action === "back-dash") {
              await updateState({ subPage: "dashboard", draftSpeech: "", petitionResult: "" });
              return;
            }

            // 3. 选秀相关
            if (action === "summon-draft") {
              const chars = await roche.character.list();
              const char = chars.find(c => c.id === argId);
              if (!char) return;
              await updateState({ selectedCharId: argId, draftSpeech: "正在移步上殿，宣召面面圣中..." });

              const prompt = `你是角色【${char.name}】（人设背景：${char.persona || char.bio || ""}）。当前在大朝选秀大典。请对皇上自荐，字数60字以内，符合古风。请直接输出对话文本，不要任何 Markdown 标记。`;
              try {
                const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                await updateState({ draftSpeech: res.text });
              } catch (e) {
                await updateState({ draftSpeech: "臣妾参见陛下，愿陛下万岁千秋。" });
              }
            }

            if (action === "appoint-harem") {
              const select = rootEl.querySelector("#draft-rank-select");
              const rank = select ? select.value : "贵人";
              const roles = { ...state.roles };
              roles[state.selectedCharId] = {
                ...(roles[state.selectedCharId] || {}),
                type: "harem",
                rank
              };
              roche.ui.toast("已册封佳丽");
              await updateState({ roles, subPage: "dashboard", selectedCharId: null, draftSpeech: "" });
            }

            // 4. 科考相关
            if (action === "start-exam") {
              const question = rootEl.querySelector("#exam-q-input")?.value || "";
              const checked = rootEl.querySelectorAll(".exam-candidate-check:checked");
              if (checked.length === 0) {
                roche.ui.toast("请至少选择一位应考举子");
                return;
              }
              const activeIds = Array.from(checked).map(c => c.value);
              await updateState({ examQuestion: question, examAnswers: { status: "loading" } });

              const answers = {};
              const chars = await roche.character.list();
              for (const cid of activeIds) {
                const char = chars.find(c => c.id === cid);
                const prompt = `你是角色【${char?.name || ""}】。当前是御试。考题为：『${question}』。请结合性格提交120字内的回答。不要任何 Markdown 标记。`;
                try {
                  const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                  answers[cid] = res.text;
                } catch {
                  answers[cid] = "臣才疏学浅，不敢妄言朝纲。";
                }
              }
              await updateState({ examAnswers: answers });
            }

            if (action === "appoint-court") {
              const select = rootEl.querySelector(`#court-rank-select-${argId}`);
              const rank = select ? select.value : "翰林学士";
              const roles = { ...state.roles };
              roles[argId] = {
                ...(roles[argId] || {}),
                type: "court",
                rank
              };
              roche.ui.toast("已钦点授官");
              await updateState({ roles, subPage: "dashboard", examAnswers: {} });
            }

            // 5. 命盘推演
            if (action === "generate-bg") {
              roche.ui.toast("正在推演天机...");
              const chars = await roche.character.list();
              const char = chars.find(c => c.id === argId);
              if (!char) return;

              const prompt = `为角色【${char.name}】（人设：${char.persona || char.bio || ""}）推演古代身份背景、家族门阀。
              返回严格合法的 JSON 对象，不要含有 Markdown 包裹标记：
              {
                "background": "此处书写150字左右的古代背景家世说明",
                "npcs": [
                  { "name": "NPC姓名", "relation": "关系", "description": "NPC简单描述" }
                ]
              }
              最多3个NPC。`;

              try {
                const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                const parsed = parseJSON(res.text, { background: "身世成谜的神秘人。", npcs: [] });
                const roles = { ...state.roles };
                roles[argId] = {
                  ...(roles[argId] || {}),
                  background: parsed.background,
                  npcs: parsed.npcs || []
                };
                roche.ui.toast("天演卷宗修成");
                await updateState({ roles });
              } catch (e) {
                roche.ui.toast("AI 推演受阻");
              }
            }

            // 6. 批阅奏折
            if (action === "fetch-petition") {
              await updateState({ currentPetition: { sender: "呈送中...", content: "驿使正加急呈递奏本..." }, petitionResult: "" });
              const prompt = `生成一封呈给皇帝的古代弹劾或邀宠奏折。返回严格的 JSON，不要含有 Markdown 包裹：
              {
                "sender": "呈奉官职及姓名",
                "content": "奏折120字内正文"
              }`;
              try {
                const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                const parsed = parseJSON(res.text, { sender: "内阁司礼监", content: "海内承平，万民请安。" });
                await updateState({ currentPetition: parsed });
              } catch {
                await updateState({ currentPetition: { sender: "中书省", content: "万寿无疆，臣等请安。" } });
              }
            }

            if (action === "handle-petition") {
              const decisions = { approve: "准奏", table: "留中", reject: "驳回" };
              const decision = decisions[argId] || "阅";
              const prompt = `奏章：『${state.currentPetition?.content}』。皇帝判定：【${decision}】。生成一段80字以内该朱批决定对朝野/后宫带来的局势波澜。不要含有 Markdown。`;
              await updateState({ petitionResult: "司礼监草拟批示中..." });
              try {
                const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                await updateState({ petitionResult: res.text, currentPetition: null });
              } catch {
                await updateState({ petitionResult: `皇上御笔亲定【${decision}】，圣旨已颁行天下。`, currentPetition: null });
              }
            }

            // 7. 驾临召见 (留宿 / 密谈)
            if (action === "launch-stay" || action === "launch-talk") {
              const isStay = action === "launch-stay";
              const chars = await roche.character.list();
              const char = chars.find(c => c.id === argId);
              const r = state.roles[argId] || { rank: "百姓" };

              let session = state.sessions.find(s => s.charId === argId && s.type === (isStay ? "stay" : "talk"));
              if (!session) {
                session = {
                  id: "sess_" + Date.now(),
                  charId: argId,
                  type: isStay ? "stay" : "talk",
                  messages: [
                    {
                      role: "system",
                      text: isStay 
                        ? `【驾临寝苑】夜色微澜，陛下驾临【${r.rank} · ${char.handle || char.name}】的寝宫安宿。摒退左右，长夜私语。` 
                        : `【密会暖阁】国事倥偬，陛下在御书房宣召【${r.rank} · ${char.handle || char.name}】进行绝密密谈。`
                    }
                  ]
                };
                const sessions = [...state.sessions, session];
                await updateState({ sessions, activeSessionId: session.id, activeTab: "sessions", subPage: "chat" });
              } else {
                await updateState({ activeSessionId: session.id, activeTab: "sessions", subPage: "chat" });
              }
            }

            // 8. 长对话消息发送
            if (action === "send-chat") {
              const input = rootEl.querySelector("#sc-chat-input");
              const text = input ? input.value.trim() : "";
              if (!text) return;

              input.value = "";
              const session = state.sessions.find(s => s.id === state.activeSessionId);
              if (!session) return;

              session.messages.push({ role: "user", text, timestamp: Date.now() });
              await updateState({ sessions: [...state.sessions] });

              const chars = await roche.character.list();
              const char = chars.find(c => c.id === session.charId);
              const r = state.roles[session.charId] || { rank: "在野", background: "", npcs: [] };

              const systemPrompt = `你正在与皇帝进行对话。
              你扮演：【${char.name}】(昵称: ${char.handle || ""})
              人设特质：${char.persona || char.bio || ""}
              在古代王朝【${state.dynasty.stateName}】（当前年号：【${state.dynasty.eraName}】）中，你获得的皇帝敕封身份为：【${r.rank}】。
              你的古代身世家底：${r.background || "平民"}。
              你的亲随随从：${(r.npcs || []).map(n => `${n.name}(${n.relation})`).join("、")}。
              当前场景：${session.type === "stay" ? "夜翻寝牌，留宿深宵，无人在旁的贴身夜谈。" : "御书房内屏退百官的君臣绝密会商。"}
              请保持角色古代身份，注意自称（如：臣妾/微臣）与对皇帝的尊称。120字以内。不要含有任何 Markdown 标记。`;

              const messagesForAI = [{ role: "system", content: systemPrompt }];
              session.messages.forEach(m => {
                if (m.role !== "system") {
                  messagesForAI.push({ role: m.role, content: m.text });
                }
              });

              try {
                session.messages.push({ role: "assistant", text: "低眉思忖，组织言辞中...", timestamp: Date.now() });
                await render();

                const aiRes = await roche.ai.chat({ messages: messagesForAI });
                session.messages.pop();
                session.messages.push({ role: "assistant", text: aiRes.text, timestamp: Date.now() });
                await updateState({ sessions: [...state.sessions] });
              } catch {
                session.messages.pop();
                session.messages.push({ role: "assistant", text: "（天恩威严，臣下惶恐，一时间未能答上话来……）", timestamp: Date.now() });
                await updateState({ sessions: [...state.sessions] });
              }
            }

            if (action === "delete-session") {
              const sessions = state.sessions.filter(s => s.id !== argId);
              await updateState({ sessions, subPage: "dashboard" });
            }

            // 9. 圣颜保存
            if (action === "save-majesty") {
              const stateName = rootEl.querySelector("#dynasty-state")?.value || "大周";
              const eraName = rootEl.querySelector("#dynasty-era")?.value || "开元";
              const userTitle = rootEl.querySelector("#dynasty-title")?.value || "朕";
              await updateState({
                dynasty: { stateName, eraName, userTitle },
                subPage: "dashboard"
              });
              roche.ui.toast("已改元换号");
            }

            // 10. 卷宗手工编辑
            if (action === "save-archive") {
              const cid = argId;
              const bg = rootEl.querySelector(`#archive-bg-${cid}`)?.value || "";
              const roles = { ...state.roles };
              if (!roles[cid]) roles[cid] = { type: null, rank: "", background: "", npcs: [] };
              roles[cid].background = bg;
              roche.ui.toast("背景秘卷已修订");
              await updateState({ roles });
            }

            if (action === "add-npc") {
              const roles = { ...state.roles };
              if (!roles[argId]) roles[argId] = { type: null, rank: "", background: "", npcs: [] };
              roles[argId].npcs = roles[argId].npcs || [];
              if (roles[argId].npcs.length >= 5) {
                roche.ui.toast("随从人数不可超过五位");
                return;
              }
              roles[argId].npcs.push({ name: "随从名", relation: "随从", description: "身家底细" });
              await updateState({ roles });
            }

            if (action === "delete-npc") {
              const [cid, idx] = argId.split("::");
              const roles = { ...state.roles };
              roles[cid].npcs.splice(parseInt(idx), 1);
              await updateState({ roles });
            }

            if (action === "save-npc") {
              const [cid, idx] = argId.split("::");
              const row = rootEl.querySelector(`.npc-row-${cid}-${idx}`);
              if (row) {
                const name = row.querySelector(".npc-name")?.value || "";
                const relation = row.querySelector(".npc-rel")?.value || "";
                const description = row.querySelector(".npc-desc")?.value || "";
                const roles = { ...state.roles };
                roles[cid].npcs[parseInt(idx)] = { name, relation, description };
                roche.ui.toast("NPC 记录修正成功");
                await updateState({ roles });
              }
            }
          };

          rootEl.addEventListener("click", onClick);
          uiListeners.push({ el: rootEl, type: "click", handler: onClick });

          async function render() {
            if (!currentContainer) return;
            const chars = await roche.character.list();

            let mainContent = "";

            // =============== DOCK - TAB 1: 国事 ===============
            if (state.activeTab === "state") {
              if (state.subPage === "dashboard") {
                mainContent = `
                  <div class="sc-page-header">
                    <div class="sc-title">
                      ${state.dynasty.stateName} · ${state.dynasty.eraName}
                      <span>天子：${state.dynasty.userTitle}</span>
                    </div>
                  </div>
                  <div class="sc-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
                    <div class="sc-card" data-action="go-sub" data-id="draft">
                      <h4 style="color:#9c2a3a; margin:0 0 6px 0;">选秀大典</h4>
                      <p style="font-size:12px; color:#666; margin:0;">宣召佳丽，赐封后宫封赏位份。</p>
                    </div>
                    <div class="sc-card" data-action="go-sub" data-id="exam">
                      <h4 style="color:#9c2a3a; margin:0 0 6px 0;">金殿科考</h4>
                      <p style="font-size:12px; color:#666; margin:0;">出题遴选。钦点授任宰辅文武。</p>
                    </div>
                    <div class="sc-card" data-action="go-sub" data-id="generate">
                      <h4 style="color:#9c2a3a; margin:0 0 6px 0;">推演生平</h4>
                      <p style="font-size:12px; color:#666; margin:0;">利用天命神算，生成身世背景及随行NPC。</p>
                    </div>
                    <div class="sc-card" data-action="go-sub" data-id="memorial">
                      <h4 style="color:#9c2a3a; margin:0 0 6px 0;">批阅奏折</h4>
                      <p style="font-size:12px; color:#666; margin:0;">审判臣工奏折，做出准奏、留中、驳回朱批。</p>
                    </div>
                    <div class="sc-card" data-action="go-sub" data-id="harem">
                      <h4 style="color:#9c2a3a; margin:0 0 6px 0;">驾临后宫</h4>
                      <p style="font-size:12px; color:#666; margin:0;">管理已有后宫佳丽，或召见翻牌留宿。</p>
                    </div>
                    <div class="sc-card" data-action="go-sub" data-id="study">
                      <h4 style="color:#9c2a3a; margin:0 0 6px 0;">御书房暖阁</h4>
                      <p style="font-size:12px; color:#666; margin:0;">召见内阁朝臣，密谈朝纲大事与晋升革除。</p>
                    </div>
                    <div class="sc-card" data-action="go-sub" data-id="majesty">
                      <h4 style="color:#9c2a3a; margin:0 0 6px 0;">圣颜修订</h4>
                      <p style="font-size:12px; color:#666; margin:0;">更改本朝国号、改换年号、更换皇帝自称。</p>
                    </div>
                  </div>
                `;
              } else if (state.subPage === "draft") {
                const haremIds = Object.keys(state.roles).filter(k => state.roles[k].type);
                const candidates = chars.filter(c => !haremIds.includes(c.id));
                let listHTML = "";
                candidates.forEach(c => {
                  listHTML += `
                    <div class="sc-item-row">
                      <span><strong>${c.handle || c.name}</strong> <small style="color:#888;">(${c.bio || "无简介"})</small></span>
                      <button class="sc-btn" style="padding:5px 12px; font-size:12px;" data-action="summon-draft" data-id="${c.id}">宣召入殿</button>
                    </div>
                  `;
                });
                if (candidates.length === 0) listHTML = `<p style="color:#888; text-align:center;">暂无在野的秀女举子。</p>`;

                let speechHTML = "";
                if (state.selectedCharId) {
                  const sc = chars.find(x => x.id === state.selectedCharId);
                  speechHTML = `
                    <div class="sc-card" style="margin-top:20px; border-left:3px solid #9c2a3a;">
                      <h5 style="margin:0 0 10px 0; color:#9c2a3a;">${sc?.handle || sc?.name} 殿前自述：</h5>
                      <div class="sc-info-card">
                        <div class="sc-info-tag">金銮殿陈词</div>
                        “ ${state.draftSpeech || "宣旨小太监传召中..."} ”
                      </div>
                      ${state.draftSpeech && state.draftSpeech !== "正在移步上殿，宣召面面圣中..." ? `
                        <div style="display:flex; gap:10px; align-items:center; margin-top:10px;">
                          <label style="font-size:12px;">封赏位份：</label>
                          <select id="draft-rank-select" class="sc-select" style="width:120px; padding:4px;">
                            ${haremRanks.map(r => `<option value="${r}">${r}</option>`).join("")}
                          </select>
                          <button class="sc-btn" style="padding:6px 14px;" data-action="appoint-harem">准册封入宫</button>
                        </div>
                      ` : ""}
                    </div>
                  `;
                }

                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <h3 style="margin-top:0;">大典：遴选佳丽</h3>
                  <div style="margin-bottom:20px;">${listHTML}</div>
                  ${speechHTML}
                `;
              } else if (state.subPage === "exam") {
                const courtIds = Object.keys(state.roles).filter(k => state.roles[k].type);
                const candidates = chars.filter(c => !courtIds.includes(c.id));
                let listHTML = "";
                candidates.forEach(c => {
                  listHTML += `
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer;">
                      <input type="checkbox" class="exam-candidate-check" value="${c.id}">
                      <span>${c.handle || c.name} <small style="color:#888;">(${c.bio || "无"})</small></span>
                    </label>
                  `;
                });
                if (candidates.length === 0) listHTML = `<p style="color:#888;">当前并无可参与应试之备选生员。</p>`;

                let answersHTML = "";
                if (state.examAnswers.status === "loading") {
                  answersHTML = `<div class="sc-info-card">考试中，各士子正在埋头伏案答卷...</div>`;
                } else if (Object.keys(state.examAnswers).length > 0) {
                  answersHTML = `<h4 style="color:#9c2a3a; margin:20px 0 10px 0;">试卷批阅：</h4>`;
                  Object.entries(state.examAnswers).forEach(([cid, ans]) => {
                    const ch = chars.find(x => x.id === cid);
                    if (!ch) return;
                    answersHTML += `
                      <div class="sc-card">
                        <strong>【生员】${ch.handle || ch.name} 呈答：</strong>
                        <div class="sc-info-card">
                          <div class="sc-info-tag">策论答卷</div>
                          ${ans}
                        </div>
                        <div style="display:flex; gap:10px; align-items:center;">
                          <label style="font-size:12px;">钦授官爵：</label>
                          <select id="court-rank-select-${cid}" class="sc-select" style="width:140px; padding:4px;">
                            ${courtRanks.map(cr => `<option value="${cr}">${cr}</option>`).join("")}
                          </select>
                          <button class="sc-btn" style="padding:6px 12px; font-size:12px;" data-action="appoint-court" data-id="${cid}">授任此职</button>
                        </div>
                      </div>
                    `;
                  });
                }

                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <h3 style="margin-top:0;">开科：金殿御试</h3>
                  <div class="sc-card">
                    <label style="font-weight:bold; display:block; margin-bottom:8px;">制订御试考题：</label>
                    <textarea id="exam-q-input" class="sc-textarea" rows="2">${state.examQuestion}</textarea>
                  </div>
                  <div class="sc-card">
                    <label style="font-weight:bold; display:block; margin-bottom:8px;">圈选参与大试的学子：</label>
                    <div style="max-height:120px; overflow-y:auto; padding:6px; border:1px solid #ededed; background:#fafafa; margin-bottom:12px;">
                      ${listHTML}
                    </div>
                    ${candidates.length > 0 ? `<button class="sc-btn" data-action="start-exam">降旨考试</button>` : ""}
                  </div>
                  ${answersHTML}
                `;
              } else if (state.subPage === "generate") {
                let listHTML = "";
                chars.forEach(c => {
                  const r = state.roles[c.id];
                  const hasBg = r && r.background;
                  listHTML += `
                    <div class="sc-item-row">
                      <div>
                        <strong>${c.handle || c.name}</strong>
                        <span style="font-size:11px; color:#666; margin-left:10px;">${r ? `[${r.rank}]` : "[在野]"}</span>
                      </div>
                      <button class="sc-btn-secondary" style="padding:4px 10px; font-size:12px; border:1px solid #ddd;" data-action="generate-bg" data-id="${c.id}">
                        ${hasBg ? "逆天重推" : "天演推算"}
                      </button>
                    </div>
                  `;
                });
                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <h3 style="margin-top:0;">天命：生平推演</h3>
                  <p style="font-size:12.5px; color:#666; margin-bottom:15px;">利用 AI 深度推演角色的古代家世出身以及周围可能存在的 NPC 亲属、死党关系线。</p>
                  <div>${listHTML}</div>
                `;
              } else if (state.subPage === "memorial") {
                let petitionHTML = "";
                if (state.currentPetition) {
                  petitionHTML = `
                    <div class="sc-card" style="border-left:3px solid #9c2a3a; padding:24px;">
                      <h4 style="margin:0 0 10px 0; color:#9c2a3a; font-size:16px;">呈折：${state.currentPetition.sender}</h4>
                      <div class="sc-info-card">
                        <div class="sc-info-tag">奏折正文</div>
                        ${state.currentPetition.content}
                      </div>
                      ${state.currentPetition.sender !== "呈送中..." ? `
                        <div style="display:flex; gap:10px; margin-top:15px;">
                          <button class="sc-btn" data-action="handle-petition" data-id="approve">准奏</button>
                          <button class="sc-btn-secondary" data-action="handle-petition" data-id="table">留中不发</button>
                          <button class="sc-btn-secondary" style="color:#b33;" data-action="handle-petition" data-id="reject">退回</button>
                        </div>
                      ` : ""}
                    </div>
                  `;
                }

                let resHTML = "";
                if (state.petitionResult) {
                  resHTML = `
                    <div class="sc-info-card" style="background:#f4f9f4; border-left-color:#2a9c4a;">
                      <div class="sc-info-tag" style="color:#2a9c4a;">起居注朱批影响反馈</div>
                      ${state.petitionResult}
                    </div>
                  `;
                }

                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <h3 style="margin-top:0;">通政：批阅奏本</h3>
                  <button class="sc-btn" style="margin-bottom:15px;" data-action="fetch-petition">呈送新的奏本</button>
                  ${petitionHTML}
                  ${resHTML}
                `;
              } else if (state.subPage === "harem") {
                const list = Object.entries(state.roles).filter(([_, r]) => r.type === "harem");
                let listHTML = "";
                list.forEach(([cid, r]) => {
                  const ch = chars.find(x => x.id === cid);
                  if (!ch) return;
                  listHTML += `
                    <div class="sc-card">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong>${ch.handle || ch.name} <span style="font-size:11px; color:#9c2a3a; margin-left:10px;">[${r.rank}]</span></strong>
                        <div style="display:flex; gap:6px;">
                          <select id="rank-select-harem-${cid}" class="sc-select" style="width:100px; padding:2px; font-size:12px;">
                            ${haremRanks.map(hr => `<option value="${hr}" ${r.rank === hr ? "selected" : ""}>${hr}</option>`).join("")}
                          </select>
                          <button class="sc-btn-secondary" style="padding:2px 8px; font-size:12px;" data-action="harem-rank-change" data-id="${cid}">改封</button>
                        </div>
                      </div>
                      <div class="sc-info-card" style="margin:5px 0 10px 0;">
                        <div class="sc-info-tag">后宫起居册</div>
                        ${r.background || "平民家世，未推演身世。"}
                      </div>
                      <div style="display:flex; gap:10px;">
                        <button class="sc-btn" style="padding:4px 12px; font-size:12px;" data-action="launch-stay" data-id="${cid}">今夜留宿</button>
                        <button class="sc-btn-secondary" style="padding:4px 12px; font-size:12px; color:#b33;" data-action="dismiss-role" data-id="${cid}">废黜</button>
                      </div>
                    </div>
                  `;
                });
                if (list.length === 0) listHTML = `<p style="color:#888; text-align:center; padding:30px;">六宫无妃，可前往选秀遴选。</p>`;

                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <h3 style="margin-top:0;">巡幸：后宫殿苑</h3>
                  <div>${listHTML}</div>
                `;
              } else if (state.subPage === "study") {
                const list = Object.entries(state.roles).filter(([_, r]) => r.type === "court");
                let listHTML = "";
                list.forEach(([cid, r]) => {
                  const ch = chars.find(x => x.id === cid);
                  if (!ch) return;
                  listHTML += `
                    <div class="sc-card">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong>${ch.handle || ch.name} <span style="font-size:11px; color:#316a8d; margin-left:10px;">[${r.rank}]</span></strong>
                        <div style="display:flex; gap:6px;">
                          <select id="rank-select-court-${cid}" class="sc-select" style="width:110px; padding:2px; font-size:12px;">
                            ${courtRanks.map(cr => `<option value="${cr}" ${r.rank === cr ? "selected" : ""}>${cr}</option>`).join("")}
                          </select>
                          <button class="sc-btn-secondary" style="padding:2px 8px; font-size:12px;" data-action="court-rank-change" data-id="${cid}">转迁</button>
                        </div>
                      </div>
                      <div class="sc-info-card" style="margin:5px 0 10px 0;">
                        <div class="sc-info-tag">臣工履历卷</div>
                        ${r.background || "寒门士子，未推演功名背景。"}
                      </div>
                      <div style="display:flex; gap:10px;">
                        <button class="sc-btn" style="padding:4px 12px; font-size:12px; background:#316a8d;" data-action="launch-talk" data-id="${cid}">暖阁密谈</button>
                        <button class="sc-btn-secondary" style="padding:4px 12px; font-size:12px; color:#b33;" data-action="dismiss-role" data-id="${cid}">革除</button>
                      </div>
                    </div>
                  `;
                });
                if (list.length === 0) listHTML = `<p style="color:#888; text-align:center; padding:30px;">满朝无臣，可前去金殿开科考选。</p>`;

                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <h3 style="margin-top:0;">召对：暖阁朝臣</h3>
                  <div>${listHTML}</div>
                `;
              } else if (state.subPage === "majesty") {
                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <h3 style="margin-top:0;">改元：修订大统</h3>
                  <div class="sc-card" style="max-width:400px; display:flex; flex-direction:column; gap:12px;">
                    <div>
                      <label style="font-size:12px; font-weight:bold;">本朝国号：</label>
                      <input type="text" id="dynasty-state" class="sc-input" value="${state.dynasty.stateName}">
                    </div>
                    <div>
                      <label style="font-size:12px; font-weight:bold;">当今主上年号：</label>
                      <input type="text" id="dynasty-era" class="sc-input" value="${state.dynasty.eraName}">
                    </div>
                    <div>
                      <label style="font-size:12px; font-weight:bold;">天子自称：</label>
                      <input type="text" id="dynasty-title" class="sc-input" value="${state.dynasty.userTitle}">
                    </div>
                    <button class="sc-btn" style="margin-top:10px;" data-action="save-majesty">颁旨，更改年号</button>
                  </div>
                `;
              }
            }

            // =============== DOCK - TAB 2: 执政录 (有独立的聊天页面) ===============
            else if (state.activeTab === "sessions") {
              if (state.subPage === "chat") {
                // 长叙事自由聊天
                const session = state.sessions.find(s => s.id === state.activeSessionId);
                if (!session) {
                  mainContent = `<p style="text-align:center; padding:30px; color:#888;">未选中会话记录，请点击下方执政录返回。</p>`;
                } else {
                  const ch = chars.find(x => x.id === session.charId);
                  const r = state.roles[session.charId] || { rank: "百姓", background: "", npcs: [] };

                  let msgsHTML = "";
                  session.messages.forEach(m => {
                    let cls = "sys";
                    if (m.role === "user") cls = "user";
                    else if (m.role === "assistant") cls = "assistant";
                    msgsHTML += `<div class="sc-chat-msg ${cls}">${m.text}</div>`;
                  });

                  let npcsHTML = "";
                  if (r.npcs && r.npcs.length > 0) {
                    r.npcs.forEach(n => {
                      npcsHTML += `
                        <div class="sc-info-card" style="padding:6px 10px; margin:5px 0; font-size:11.5px; border-left-color:#777;">
                          <strong>${n.name}</strong> <small style="color:#666;">(${n.relation})</small>
                          <div style="color:#777; margin-top:2px;">${n.description}</div>
                        </div>
                      `;
                    });
                  } else {
                    npcsHTML = `<div style="font-size:12px; color:#888;">暂无连带NPC数据</div>`;
                  }

                  mainContent = `
                    <div class="sc-back-action" data-action="go-sub" data-id="dashboard">⬅ 结束本场，回执政录</div>
                    <div class="sc-chat-grid">
                      <div class="sc-chat-aside">
                        <h4 style="margin:0 0 10px 0; color:#9c2a3a;">起居注底册</h4>
                        <div style="font-size:13px; line-height:1.4; margin-bottom:12px;">
                          <strong>姓名：</strong>${ch?.name}<br>
                          <strong>封号：</strong>${r.rank}
                        </div>
                        <div class="sc-info-card" style="padding:8px 12px; font-size:12px;">
                          <div class="sc-info-tag">身家背景</div>
                          ${r.background || "平民"}
                        </div>
                        <h5 style="margin:10px 0 5px 0; font-size:12px; color:#555;">连带NPC关系网络：</h5>
                        ${npcsHTML}
                      </div>
                      <div class="sc-chat-room">
                        <div class="sc-chat-history" id="sc-chat-scroller">
                          ${msgsHTML}
                        </div>
                        <div class="sc-chat-input-area">
                          <input type="text" id="sc-chat-input" class="sc-input" placeholder="输入旨意长叙..." onkeydown="if(event.key==='Enter') { document.querySelector('[data-action=\\'send-chat\\']').click(); }">
                          <button class="sc-btn" data-action="send-chat">传旨</button>
                        </div>
                      </div>
                    </div>
                  `;
                  setTimeout(() => {
                    const box = rootEl.querySelector("#sc-chat-scroller");
                    if (box) box.scrollTop = box.scrollHeight;
                  }, 50);
                }
              } else {
                // 执政会商目录
                let listHTML = "";
                state.sessions.forEach(s => {
                  const ch = chars.find(x => x.id === s.charId);
                  const r = state.roles[s.charId] || { rank: "百姓" };
                  if (!ch) return;
                  listHTML += `
                    <div class="sc-item-row">
                      <div>
                        <strong>${s.type === "stay" ? "【寝苑夜宿】" : "【暖阁召对】"} ${ch.handle || ch.name}</strong>
                        <span style="font-size:11px; background:#f4e8e9; color:#9c2a3a; padding:1px 6px; border-radius:3px; margin-left:10px;">${r.rank}</span>
                      </div>
                      <div style="display:flex; gap:8px;">
                        <button class="sc-btn" style="padding:4px 12px; font-size:12px;" data-action="go-page" data-id="chat" onclick="window.shangchao_activeSessionId='${s.id}'" data-sess-injector="${s.id}">驾临</button>
                        <button class="sc-btn-secondary" style="padding:4px 12px; font-size:12px; color:#b33;" data-action="delete-session" data-id="${s.id}">结束</button>
                      </div>
                    </div>
                  `;
                });
                if (state.sessions.length === 0) {
                  listHTML = `<p style="color:#888; text-align:center; padding:40px;">当前并无正在进行中的留宿夜谈或重臣密商。</p>`;
                }

                mainContent = `
                  <div class="sc-page-header">
                    <div class="sc-title">执政录 <span>起居注</span></div>
                  </div>
                  <p style="font-size:12.5px; color:#666; margin-bottom:15px;">此处存档当前正在进行的留宿和召对叙事，点击“驾临”可以继承自由对话会谈。</p>
                  <div>${listHTML}</div>
                `;
                setTimeout(() => {
                  rootEl.querySelectorAll("[data-sess-injector]").forEach(btn => {
                    btn.addEventListener("click", () => {
                      state.activeSessionId = btn.getAttribute("data-sess-injector");
                      updateState({ subPage: "chat" });
                    });
                  });
                }, 50);
              }
            }

            // =============== DOCK - TAB 3: 卷宗 ===============
            else if (state.activeTab === "archives") {
              let listHTML = "";
              chars.forEach(c => {
                const r = state.roles[c.id] || { type: null, rank: "百姓", background: "", npcs: [] };

                let npcsHTML = "";
                (r.npcs || []).forEach((n, idx) => {
                  npcsHTML += `
                    <div class="npc-row-${c.id}-${idx}" style="display:flex; gap:6px; margin-bottom:6px; align-items:center;">
                      <input type="text" class="sc-input npc-name" style="width:70px; padding:4px; font-size:12px;" value="${n.name}" placeholder="姓名">
                      <input type="text" class="sc-input npc-rel" style="width:70px; padding:4px; font-size:12px;" value="${n.relation}" placeholder="关系">
                      <input type="text" class="sc-input npc-desc" style="width:180px; padding:4px; font-size:12px;" value="${n.description}" placeholder="随从身家描述">
                      <button class="sc-btn" style="padding:2px 8px; font-size:11px;" data-action="save-npc" data-id="${c.id}::${idx}">存</button>
                      <button class="sc-btn-secondary" style="padding:2px 8px; font-size:11px; color:#b33;" data-action="delete-npc" data-id="${c.id}::${idx}">删</button>
                    </div>
                  `;
                });

                listHTML += `
                  <div class="sc-card">
                    <div style="font-weight:bold; margin-bottom:10px; font-size:15px; color:#1a1a1a;">
                      ${c.handle || c.name} 
                      <span style="font-size:11px; font-weight:normal; background:#eaeaea; color:#444; padding:2px 6px; border-radius:4px; margin-left:10px;">
                        ${r.type === "harem" ? "后宫" : r.type === "court" ? "朝廷" : "在野"} · ${r.rank}
                      </span>
                    </div>
                    <div style="margin-bottom:12px;">
                      <label style="font-size:11.5px; color:#666; display:block; margin-bottom:4px;">身世履历（背景框）：</label>
                      <textarea id="archive-bg-${c.id}" class="sc-textarea" rows="2" style="font-size:12.5px; line-height:1.5;">${r.background || ""}</textarea>
                      <button class="sc-btn-secondary" style="padding:3px 10px; font-size:11px; margin-top:5px; border:1px solid #ddd;" data-action="save-archive" data-id="${c.id}">存背景</button>
                    </div>
                    <div>
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="font-size:11.5px; color:#666;">亲密随属NPC：</span>
                        <button class="sc-btn" style="padding:2px 8px; font-size:11px;" data-action="add-npc" data-id="${c.id}">+ 增随属</button>
                      </div>
                      ${npcsHTML}
                    </div>
                  </div>
                `;
              });
              if (chars.length === 0) listHTML = `<p style="color:#888; text-align:center;">暂无宿主角色，请先创建角色。</p>`;

              mainContent = `
                <div class="sc-page-header">
                  <div class="sc-title">内阁中书 <span>秘卷修编</span></div>
                </div>
                <p style="font-size:12.5px; color:#666; margin-bottom:15px;">在此可对臣工秀女的生平以及社会随行亲随NPC进行无AI干扰的手工细节调订。</p>
                <div style="max-height: 520px; overflow-y:auto; padding-right:6px;">${listHTML}</div>
              `;
            }

            // =============== 组装整体 Shell ===============
            rootEl.innerHTML = `
              <div class="sc-shell">
                <div class="sc-main-view">
                  ${mainContent}
                </div>
                
                <!-- 底部 Dock 导航栏 -->
                <div class="sc-dock">
                  <div class="sc-dock-item ${state.activeTab === "state" ? "active" : ""}" data-action="switch-tab" data-id="state">
                    <svg class="sc-dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                    <span>国事</span>
                  </div>
                  <div class="sc-dock-item ${state.activeTab === "sessions" ? "active" : ""}" data-action="switch-tab" data-id="sessions">
                    <svg class="sc-dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span>执政录</span>
                  </div>
                  <div class="sc-dock-item ${state.activeTab === "archives" ? "active" : ""}" data-action="switch-tab" data-id="archives">
                    <svg class="sc-dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span>卷宗</span>
                  </div>
                </div>
              </div>
            `;
          }

          await render();
        },

        async unmount(container, roche) {
          uiListeners.forEach(({ el, type, handler }) => {
            if (el) el.removeEventListener(type, handler);
          });
          uiListeners = [];

          const styleEl = container.querySelector("#shangchao-plugin-css");
          if (styleEl) styleEl.remove();

          container.replaceChildren();
          currentContainer = null;
        }
      }
    ]
  });
})();