(function () {
  const PLUGIN_ID = "shangchao-plugin";
  const APP_ID = "shangchao-home";
  const STORAGE_KEY = "shangchao_state_v1.2";

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
    subPage: "dashboard", // 各 Tab 下的具体页面
    activeSessionId: null,
    selectedCharId: null,
    examQuestion: "今水旱不均，国库渐虚，何策可使百姓丰登、朝廷殷实？",
    examAnswers: {}, // charId -> text
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
    version: "1.2.0",
    apps: [
      {
        id: APP_ID,
        name: "上朝！",
        icon: "",
        iconImage: BOOK_ICON_SVG,
        async mount(container, roche) {
          currentContainer = container;

          let savedState = {};
          try {
            savedState = (await roche.storage.get(STORAGE_KEY)) || {};
          } catch (e) {
            console.error("加载数据失败:", e);
          }

          const state = { ...defaultState, ...savedState };
          state.dynasty = { ...defaultState.dynasty, ...savedState.dynasty };

          const styleEl = document.createElement("style");
          styleEl.id = "shangchao-plugin-css";
          styleEl.innerHTML = `
            .roche-plugin-shangchao {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
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
            .sc-shell {
              flex: 1;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              position: relative;
            }
            .sc-main-view {
              flex: 1;
              overflow-y: auto;
              padding: 28px;
              padding-bottom: 96px; /* 预留底部悬浮 Dock 高度 */
            }
            /* 宽敞信息框 */
            .sc-card {
              background: #ffffff;
              border: 1px solid #eaeaea;
              border-radius: 8px;
              padding: 24px;
              margin-bottom: 20px;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.015);
            }
            /* 长文本内容边框卡片 */
            .sc-info-card {
              border: 1px solid #e0e0e0;
              background-color: #f8f8f8;
              border-radius: 6px;
              padding: 16px 20px;
              margin: 14px 0;
              font-size: 14px;
              color: #333333;
              line-height: 1.7;
              border-left: 4px solid #9c2a3a;
            }
            .sc-info-tag {
              font-size: 11px;
              color: #9c2a3a;
              font-weight: bold;
              letter-spacing: 1px;
              margin-bottom: 8px;
              text-transform: uppercase;
              border-bottom: 1px dashed #e0e0e0;
              padding-bottom: 6px;
            }
            /* 底部现代化 Dock */
            .sc-dock {
              position: absolute;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              width: 90%;
              max-width: 500px;
              height: 64px;
              background: rgba(255, 255, 255, 0.96);
              backdrop-filter: blur(12px);
              border: 1px solid #dedede;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
              border-radius: 32px;
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
              width: 22px;
              height: 22px;
              margin-bottom: 2px;
              stroke: currentColor;
            }
            /* 全屏跳转顶部面包屑 */
            .sc-back-action {
              display: inline-flex;
              align-items: center;
              cursor: pointer;
              color: #9c2a3a;
              font-size: 14px;
              font-weight: 500;
              gap: 6px;
              margin-bottom: 20px;
              padding: 4px 8px;
              border-radius: 4px;
              background: #f1ebd980;
              width: fit-content;
              transition: background 0.2s;
            }
            .sc-back-action:hover {
              background: #f1ebd9c0;
            }
            /* 现代标题栏 */
            .sc-page-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 24px;
              padding-bottom: 12px;
              border-bottom: 1px solid #eaeaea;
            }
            .sc-title {
              font-size: 24px;
              color: #1a1a1a;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .sc-title span {
              font-size: 13px;
              background: #9c2a3a;
              color: #ffffff;
              padding: 2px 8px;
              border-radius: 4px;
              font-weight: normal;
            }
            /* 输入框 */
            .sc-input, .sc-textarea, .sc-select {
              width: 100%;
              background: #ffffff;
              border: 1px solid #dcdcdc;
              border-radius: 6px;
              padding: 12px 16px;
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
              padding: 12px 20px;
              font-size: 14px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: background 0.2s;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            .sc-btn:hover {
              background: #b53849;
            }
            .sc-btn-secondary {
              background: #f0f0f0;
              color: #444;
              border: none;
              padding: 12px 20px;
              font-size: 14px;
              border-radius: 6px;
              cursor: pointer;
              transition: background 0.2s;
            }
            .sc-btn-secondary:hover {
              background: #e4e4e4;
            }
            /* 横条列表 */
            .sc-item-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px 20px;
              background: #ffffff;
              border: 1px solid #eaeaea;
              border-radius: 8px;
              margin-bottom: 12px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.01);
            }
            /* 宽大对话分栏 */
            .sc-chat-grid {
              display: grid;
              grid-template-columns: 320px 1fr;
              gap: 24px;
              height: 580px;
            }
            .sc-chat-aside {
              border-right: 1px solid #eaeaea;
              padding-right: 20px;
              overflow-y: auto;
            }
            .sc-chat-room {
              display: flex;
              flex-direction: column;
              height: 100%;
              background: #ffffff;
              border: 1px solid #eaeaea;
              border-radius: 8px;
              overflow: hidden;
            }
            .sc-chat-history {
              flex: 1;
              overflow-y: auto;
              padding: 20px;
              display: flex;
              flex-direction: column;
              gap: 14px;
              background: #fafafa;
            }
            .sc-chat-msg {
              max-width: 75%;
              padding: 12px 16px;
              border-radius: 8px;
              font-size: 14px;
              line-height: 1.6;
            }
            .sc-chat-msg.sys {
              align-self: center;
              background: #e6e6e6;
              color: #555;
              font-size: 12px;
              border-radius: 4px;
              padding: 4px 12px;
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
              border: 1px solid #eaeaea;
            }
            .sc-chat-input-area {
              display: flex;
              padding: 14px;
              gap: 12px;
              border-top: 1px solid #eaeaea;
              background: #ffffff;
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
              console.error("存储失败:", e);
            }
            await render();
          }

          const onClick = async (e) => {
            const target = e.target;
            const action = target.getAttribute("data-action") || target.closest("[data-action]")?.getAttribute("data-action");
            const argId = target.getAttribute("data-id") || target.closest("[data-id]")?.getAttribute("data-id");

            if (!action) return;

            // Dock 主选项卡导航
            if (action === "switch-tab") {
              await updateState({ activeTab: argId, subPage: "dashboard", draftSpeech: "", petitionResult: "" });
              return;
            }

            // 局部跳转路由
            if (action === "go-sub") {
              await updateState({ subPage: argId, draftSpeech: "", petitionResult: "" });
              return;
            }
            if (action === "back-dash") {
              await updateState({ subPage: "dashboard", draftSpeech: "", petitionResult: "" });
              return;
            }

            // 1. 选秀召见（全屏跳转交流）
            if (action === "summon-draft") {
              const chars = await roche.character.list();
              const char = chars.find(c => c.id === argId);
              if (!char) return;

              await updateState({ selectedCharId: argId, draftSpeech: "宣召秀女殿前面聆天音中...", subPage: "draft-talk" });

              const prompt = `你是角色【${char.name}】（人设：${char.persona || char.bio || ""}）。当前在大朝选秀殿试上，被皇帝（用户）单独宣召出列。请说一段对皇上的感恩、问候或自荐言语。古风白话，字数80字以内，不要含有任何 Markdown 标记。`;
              try {
                const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                await updateState({ draftSpeech: res.text });
              } catch {
                await updateState({ draftSpeech: "秀女参见皇上，愿吾皇万岁，万寿无疆。" });
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
              roche.ui.toast("已册封封位");
              await updateState({ roles, subPage: "dashboard", selectedCharId: null, draftSpeech: "" });
            }

            // 2. 御前大考（全屏路由到答卷列表，再全屏路由至单人审阅与授官）
            if (action === "start-exam") {
              const question = rootEl.querySelector("#exam-q-input")?.value || "";
              const checked = rootEl.querySelectorAll(".exam-candidate-check:checked");
              if (checked.length === 0) {
                roche.ui.toast("请至少选择一位应考考生");
                return;
              }
              const activeIds = Array.from(checked).map(c => c.value);
              await updateState({ examQuestion: question, examAnswers: { status: "loading" }, subPage: "exam-grading" });

              const answers = {};
              const chars = await roche.character.list();
              for (const cid of activeIds) {
                const char = chars.find(c => c.id === cid);
                const prompt = `你是【${char?.name || ""}】。当前是御前大考，皇帝考题为：『${question}』。提交一份古雅策论答卷，字数120字内。不要含有 Markdown。`;
                try {
                  const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                  answers[cid] = res.text;
                } catch {
                  answers[cid] = "臣才学有限，斗胆请罪，难答此题。";
                }
              }
              await updateState({ examAnswers: answers });
            }

            if (action === "go-exam-appoint") {
              // 跳转到指定考生的独立评卷全屏页面
              await updateState({ selectedCharId: argId, subPage: "exam-appoint" });
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
              roche.ui.toast("已授予官职");
              // 如果还有其他生员没有册封，回退到评分，否则回退到主页
              const remaining = { ...state.examAnswers };
              delete remaining[argId];
              if (Object.keys(remaining).length > 0) {
                await updateState({ roles, examAnswers: remaining, subPage: "exam-grading" });
              } else {
                await updateState({ roles, examAnswers: {}, subPage: "dashboard" });
              }
            }

            // 3. 命盘推演（跳转到独立角色命盘详情页）
            if (action === "go-generate-detail") {
              await updateState({ selectedCharId: argId, subPage: "generate-detail" });
            }

            if (action === "generate-bg") {
              const cid = state.selectedCharId;
              const chars = await roche.character.list();
              const char = chars.find(c => c.id === cid);
              if (!char) return;

              roche.ui.toast("推算中...");
              const prompt = `请为角色【${char.name}】（人设：${char.persona || char.bio || ""}）推算一个架空古代身份背景和连带社交随从NPC。返回严格 JSON，不要含有 Markdown 包裹：
              {
                "background": "此处书写200字左右的高品质古代门阀、家世、平生遭遇描述",
                "npcs": [
                  { "name": "NPC名字", "relation": "关系", "description": "NPC50字内简评" }
                ]
              }
              最多3位NPC。`;

              try {
                const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                const parsed = parseJSON(res.text, { background: "隐世宗族的历练子弟。", npcs: [] });
                const roles = { ...state.roles };
                roles[cid] = {
                  ...(roles[cid] || {}),
                  background: parsed.background,
                  npcs: parsed.npcs || []
                };
                roche.ui.toast("命星推算完毕");
                await updateState({ roles });
              } catch {
                roche.ui.toast("命理推演受阻");
              }
            }

            // 4. 批阅奏折（全屏路由跳转）
            if (action === "fetch-petition") {
              await updateState({ currentPetition: { sender: "呈递中...", content: "加急驿卷快马入宫..." }, petitionResult: "", subPage: "memorial-detail" });
              const prompt = `生成一封呈给皇帝的极具勾心斗角或民生家国内容的古代奏本折子。返回严格 JSON，不含 Markdown：
              {
                "sender": "上书人官职姓名",
                "content": "奏折150字正文"
              }`;
              try {
                const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                const parsed = parseJSON(res.text, { sender: "内阁通政司", content: "海内晏平，万寿无疆。" });
                await updateState({ currentPetition: parsed });
              } catch {
                await updateState({ currentPetition: { sender: "中书舍人", content: "天朗气清，恭请圣安。" } });
              }
            }

            if (action === "handle-petition") {
              const decisions = { approve: "准奏", table: "留中", reject: "驳回" };
              const decision = decisions[argId] || "阅";
              const prompt = `奏章来自【${state.currentPetition?.sender}】。正文：『${state.currentPetition?.content}』。皇帝做出朱批：【${decision}】。写一段80字内古雅旁白，说明其局势后续影响。无 Markdown。`;

              await updateState({ petitionResult: "司礼监奉旨撰拟中...", subPage: "memorial-result" });
              try {
                const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                await updateState({ petitionResult: res.text, currentPetition: null });
              } catch {
                await updateState({ petitionResult: `皇上亲定【${decision}】，通政司奉旨承办发往地方。`, currentPetition: null });
              }
            }

            // 5. 巡幸与召对详情（全屏跳转详情管理，不再挤在一行）
            if (action === "go-harem-detail") {
              await updateState({ selectedCharId: argId, subPage: "harem-detail" });
            }
            if (action === "go-court-detail") {
              await updateState({ selectedCharId: argId, subPage: "court-detail" });
            }

            if (action === "harem-rank-change") {
              const select = rootEl.querySelector("#rank-select-harem-detail");
              if (!select) return;
              const roles = { ...state.roles };
              roles[state.selectedCharId].rank = select.value;
              roche.ui.toast("已晋爵改任位份");
              await updateState({ roles });
            }

            if (action === "court-rank-change") {
              const select = rootEl.querySelector("#rank-select-court-detail");
              if (!select) return;
              const roles = { ...state.roles };
              roles[state.selectedCharId].rank = select.value;
              roche.ui.toast("已调迁任命官职");
              await updateState({ roles });
            }

            if (action === "dismiss-role-detail") {
              const ok = await roche.ui.confirm({ title: "罢免敕封", message: "确定革除其在本朝名录中的位份官职并逐出朝堂后宫吗？" });
              if (!ok) return;
              const roles = { ...state.roles };
              delete roles[state.selectedCharId];
              roche.ui.toast("已革除名籍");
              await updateState({ roles, subPage: "dashboard" });
            }

            // 6. 长会商（留宿与密谈）
            if (action === "launch-stay" || action === "launch-talk") {
              const isStay = action === "launch-stay";
              const cid = state.selectedCharId;
              const chars = await roche.character.list();
              const char = chars.find(c => c.id === cid);
              const r = state.roles[cid] || { rank: "百姓" };

              let session = state.sessions.find(s => s.charId === cid && s.type === (isStay ? "stay" : "talk"));
              if (!session) {
                session = {
                  id: "sess_" + Date.now(),
                  charId: cid,
                  type: isStay ? "stay" : "talk",
                  messages: [
                    {
                      role: "system",
                      text: isStay 
                        ? `【驾临寝苑】明烛夜深，圣驾已莅临【${r.rank} · ${char.handle || char.name}】宿处安置。屏退内侍，执手长叙。` 
                        : `【密会暖阁】国事繁重，陛下特于御书房召见【${r.rank} · ${char.handle || char.name}】。`
                    }
                  ]
                };
                const sessions = [...state.sessions, session];
                await updateState({ sessions, activeSessionId: session.id, activeTab: "sessions", subPage: "chat" });
              } else {
                await updateState({ activeSessionId: session.id, activeTab: "sessions", subPage: "chat" });
              }
            }

            // 7. 长对话消息发送
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

              const systemPrompt = `你现在是古代人物扮演。
              你扮演：【${char.name}】（人设：${char.persona || char.bio || ""}）。
              在当今王朝【${state.dynasty.stateName}】（当前年号：【${state.dynasty.eraName}】）中，你获得的地位是：【${r.rank}】。
              你的生平底细：${r.background || "平民"}。
              亲随NPC：${(r.npcs || []).map(n => `${n.name}(${n.relation})`).join("、")}。
              当前场景：${session.type === "stay" ? "夜翻绿牌留宿春宵，无人在旁的贴身长叙。" : "暖阁朝臣密商，探究天下局势大计。"}
              请扮演好你的人设，注意用词举止和对皇帝尊称。120字内。不带 Markdown 标记。`;

              const messagesForAI = [{ role: "system", content: systemPrompt }];
              session.messages.forEach(m => {
                if (m.role !== "system") messagesForAI.push({ role: m.role, content: m.text });
              });

              try {
                session.messages.push({ role: "assistant", text: "正在低头凝思，组织措辞...", timestamp: Date.now() });
                await render();

                const aiRes = await roche.ai.chat({ messages: messagesForAI });
                session.messages.pop();
                session.messages.push({ role: "assistant", text: aiRes.text, timestamp: Date.now() });
                await updateState({ sessions: [...state.sessions] });
              } catch {
                session.messages.pop();
                session.messages.push({ role: "assistant", text: "（诚惶诚恐，一时间惊出微汗，未敢应答……）", timestamp: Date.now() });
                await updateState({ sessions: [...state.sessions] });
              }
            }

            if (action === "delete-session") {
              const sessions = state.sessions.filter(s => s.id !== argId);
              await updateState({ sessions, subPage: "dashboard" });
            }

            // 8. 圣颜保存
            if (action === "save-majesty") {
              const stateName = rootEl.querySelector("#dynasty-state")?.value || "大周";
              const eraName = rootEl.querySelector("#dynasty-era")?.value || "开元";
              const userTitle = rootEl.querySelector("#dynasty-title")?.value || "朕";
              await updateState({
                dynasty: { stateName, eraName, userTitle },
                subPage: "dashboard"
              });
              roche.ui.toast("已传召大理寺改元换代");
            }

            // 9. 卷宗细节编辑跳转
            if (action === "go-archive-edit") {
              await updateState({ selectedCharId: argId, subPage: "archive-edit" });
            }

            if (action === "save-archive") {
              const cid = state.selectedCharId;
              const bg = rootEl.querySelector(`#archive-bg-${cid}`)?.value || "";
              const roles = { ...state.roles };
              if (!roles[cid]) roles[cid] = { type: null, rank: "百姓", background: "", npcs: [] };
              roles[cid].background = bg;
              roche.ui.toast("密卷档案已修录");
              await updateState({ roles });
            }

            if (action === "add-npc") {
              const cid = state.selectedCharId;
              const roles = { ...state.roles };
              if (!roles[cid]) roles[cid] = { type: null, rank: "百姓", background: "", npcs: [] };
              roles[cid].npcs = roles[cid].npcs || [];
              if (roles[cid].npcs.length >= 5) {
                roche.ui.toast("随属人脉网络不可超过五人");
                return;
              }
              roles[cid].npcs.push({ name: "亲属/仆人名", relation: "关系", description: "背景描述" });
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
                roche.ui.toast("随属履历保存成功");
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

            // ================== TAB: 国事 ==================
            if (state.activeTab === "state") {
              if (state.subPage === "dashboard") {
                mainContent = `
                  <div class="sc-page-header">
                    <div class="sc-title">
                      ${state.dynasty.stateName} · ${state.dynasty.eraName}
                      <span>执政：${state.dynasty.userTitle}</span>
                    </div>
                  </div>
                  <div class="sc-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px;">
                    <div class="sc-card" style="cursor:pointer;" data-action="go-sub" data-id="draft-list">
                      <h4 style="color:#9c2a3a; margin:0 0 8px 0;">选秀大典</h4>
                      <p style="font-size:12.5px; color:#666; margin:0; line-height:1.5;">遴选备选秀阁生员，宣召他们上殿单聚交流，并册赐封号位份。</p>
                    </div>
                    <div class="sc-card" style="cursor:pointer;" data-action="go-sub" data-id="exam-init">
                      <h4 style="color:#9c2a3a; margin:0 0 8px 0;">金殿科考</h4>
                      <p style="font-size:12.5px; color:#666; margin:0; line-height:1.5;">御前出考题，考生单独交卷，跳转独立全屏空间阅卷赐任。</p>
                    </div>
                    <div class="sc-card" style="cursor:pointer;" data-action="go-sub" data-id="generate-list">
                      <h4 style="color:#9c2a3a; margin:0 0 8px 0;">命盘推演</h4>
                      <p style="font-size:12.5px; color:#666; margin:0; line-height:1.5;">针对单个角色推导其不凡出身家世、起居和随属社会NPC。</p>
                    </div>
                    <div class="sc-card" style="cursor:pointer;" data-action="go-sub" data-id="memorial-dashboard">
                      <h4 style="color:#9c2a3a; margin:0 0 8px 0;">批阅奏折</h4>
                      <p style="font-size:12.5px; color:#666; margin:0; line-height:1.5;">单独调阅全国百僚或六宫密呈卷章。准奏或裁夺。</p>
                    </div>
                    <div class="sc-card" style="cursor:pointer;" data-action="go-sub" data-id="harem-list">
                      <h4 style="color:#9c2a3a; margin:0 0 8px 0;">掖庭后宫</h4>
                      <p style="font-size:12.5px; color:#666; margin:0; line-height:1.5;">列出已受册封的后宫妃嫔。单独召见管理和留宿夜长叙。</p>
                    </div>
                    <div class="sc-card" style="cursor:pointer;" data-action="go-sub" data-id="court-list">
                      <h4 style="color:#9c2a3a; margin:0 0 8px 0;">御书书院</h4>
                      <p style="font-size:12.5px; color:#666; margin:0; line-height:1.5;">列出在任辅臣。跳转单人暖阁密谈进行核心朝议大策。</p>
                    </div>
                    <div class="sc-card" style="cursor:pointer;" data-action="go-sub" data-id="majesty-edit">
                      <h4 style="color:#9c2a3a; margin:0 0 8px 0;">朝代订改</h4>
                      <p style="font-size:12.5px; color:#666; margin:0; line-height:1.5;">定制本朝代专属帝王名号自称、年号及国号。</p>
                    </div>
                  </div>
                `;
              } 
              // == 选秀列表 ==
              else if (state.subPage === "draft-list") {
                const haremIds = Object.keys(state.roles).filter(k => state.roles[k].type);
                const candidates = chars.filter(c => !haremIds.includes(c.id));
                let listHTML = "";
                candidates.forEach(c => {
                  listHTML += `
                    <div class="sc-item-row">
                      <div>
                        <strong>${c.handle || c.name}</strong>
                        <span style="font-size:12px; color:#777; margin-left:12px;">${c.bio || "清白出身"}</span>
                      </div>
                      <button class="sc-btn" style="padding:6px 14px; font-size:13px;" data-action="summon-draft" data-id="${c.id}">宣召上殿</button>
                    </div>
                  `;
                });
                if (candidates.length === 0) listHTML = `<p style="color:#888; text-align:center;">天下贤能秀秀皆已悉数在列，暂无其他可召人选。</p>`;

                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <h3 style="margin-top:0;">大选名录：在野举选人</h3>
                  <div style="margin-top:20px;">${listHTML}</div>
                `;
              }
              // == 选秀单独召见对话（全屏跳转） ==
              else if (state.subPage === "draft-talk") {
                const sc = chars.find(x => x.id === state.selectedCharId);
                mainContent = `
                  <div class="sc-back-action" data-action="go-sub" data-id="draft-list">⬅ 返回秀阁名录</div>
                  <div class="sc-card">
                    <h3 style="margin-top:0; color:#9c2a3a;">殿上面圣交流：【${sc?.handle || sc?.name}】</h3>
                    <div class="sc-info-card">
                      <div class="sc-info-tag">秀女贡生 跪奏御音</div>
                      “ ${state.draftSpeech} ”
                    </div>
                    
                    ${state.draftSpeech && state.draftSpeech !== "宣召秀女殿前面聆天音中..." ? `
                      <div style="margin-top:24px; display:flex; gap:16px; align-items:center; border-top:1px solid #eaeaea; padding-top:20px;">
                        <label style="font-size:13px; font-weight:bold;">准赐封位名分：</label>
                        <select id="draft-rank-select" class="sc-select" style="width:140px;">
                          ${haremRanks.map(r => `<option value="${r}">${r}</option>`).join("")}
                        </select>
                        <button class="sc-btn" data-action="appoint-harem">册封，迁入掖庭</button>
                        <button class="sc-btn-secondary" style="color:#b33;" data-action="go-sub" data-id="draft-list">不合圣心，赐花遣退</button>
                      </div>
                    ` : ""}
                  </div>
                `;
              }
              // == 科考题拟 ==
              else if (state.subPage === "exam-init") {
                const courtIds = Object.keys(state.roles).filter(k => state.roles[k].type);
                const candidates = chars.filter(c => !courtIds.includes(c.id));
                let listHTML = "";
                candidates.forEach(c => {
                  listHTML += `
                    <label style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #f6f6f6; cursor:pointer;">
                      <input type="checkbox" class="exam-candidate-check" value="${c.id}">
                      <strong>${c.handle || c.name}</strong> <small style="color:#888;">(${c.bio || "贡才"})</small>
                    </label>
                  `;
                });
                if (candidates.length === 0) listHTML = `<p style="color:#888;">本朝群僚皆已在任。暂无可参与御试之人。</p>`;

                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <h3 style="margin-top:0;">殿试起因：降旨出题</h3>
                  <div class="sc-card">
                    <label style="font-weight:bold; display:block; margin-bottom:8px;">拟出殿试考题：</label>
                    <textarea id="exam-q-input" class="sc-textarea" rows="2">${state.examQuestion}</textarea>
                  </div>
                  <div class="sc-card">
                    <label style="font-weight:bold; display:block; margin-bottom:10px;">圈选准予参试的贡士：</label>
                    <div style="max-height:180px; overflow-y:auto; padding:8px; border:1px solid #eaeaea; background:#fafafa; border-radius:6px; margin-bottom:16px;">
                      ${listHTML}
                    </div>
                    ${candidates.length > 0 ? `<button class="sc-btn" data-action="start-exam">制御批，开科考试</button>` : ""}
                  </div>
                `;
              }
              // == 全屏科考卷宗列表 ==
              else if (state.subPage === "exam-grading") {
                mainContent = `
                  <div class="sc-back-action" data-action="go-sub" data-id="exam-init">⬅ 重新出题</div>
                  <h3 style="margin-top:0;">贡士考卷收取情况</h3>
                `;

                if (state.examAnswers.status === "loading") {
                  mainContent += `<div class="sc-info-card">考试完毕，各考生答卷正用朱泥糊名登记录入中...</div>`;
                } else {
                  let rowsHTML = "";
                  Object.entries(state.examAnswers).forEach(([cid, ans]) => {
                    const ch = chars.find(x => x.id === cid);
                    if (!ch) return;
                    rowsHTML += `
                      <div class="sc-item-row">
                        <span><strong>【考生】${ch.handle || ch.name}</strong> 的答卷已安全录案。</span>
                        <button class="sc-btn" style="padding:6px 14px; font-size:13px;" data-action="go-exam-appoint" data-id="${cid}">跳转阅卷，并单独授任</button>
                      </div>
                    `;
                  });
                  mainContent += `<div style="margin-top:20px;">${rowsHTML}</div>`;
                }
              }
              // == 独立考生阅卷授任（全屏跳转） ==
              else if (state.subPage === "exam-appoint") {
                const cid = state.selectedCharId;
                const ch = chars.find(x => x.id === cid);
                const answer = state.examAnswers[cid] || "";

                mainContent = `
                  <div class="sc-back-action" data-action="go-sub" data-id="exam-grading">⬅ 返回答卷总名录</div>
                  <div class="sc-card">
                    <h3 style="margin-top:0; color:#9c2a3a;">御览考生【${ch?.handle || ch?.name}】答卷</h3>
                    <div class="sc-info-card">
                      <div class="sc-info-tag">考生策论答卷全文</div>
                      “ ${answer} ”
                    </div>
                    <div style="margin-top:24px; border-top:1px solid #eaeaea; padding-top:20px; display:flex; gap:16px; align-items:center;">
                      <label style="font-size:13px; font-weight:bold;">钦点授任本朝官爵：</label>
                      <select id="court-rank-select-${cid}" class="sc-select" style="width:160px;">
                        ${courtRanks.map(cr => `<option value="${cr}">${cr}</option>`).join("")}
                      </select>
                      <button class="sc-btn" data-action="appoint-court" data-id="${cid}">当殿点拔，恩准入仕</button>
                    </div>
                  </div>
                `;
              }
              // == 推演人物名录 ==
              else if (state.subPage === "generate-list") {
                let listHTML = "";
                chars.forEach(c => {
                  const r = state.roles[c.id];
                  const hasBg = r && r.background;
                  listHTML += `
                    <div class="sc-item-row">
                      <div>
                        <strong>${c.handle || c.name}</strong>
                        <span style="font-size:12px; color:#666; margin-left:12px;">
                          ${r ? `[已封授 - ${r.rank}]` : "[在野]"} 
                          ${hasBg ? "（已有命格背景档案）" : "（暂无身世背景）"}
                        </span>
                      </div>
                      <button class="sc-btn" style="padding:6px 14px; font-size:13px;" data-action="go-generate-detail" data-id="${c.id}">进入天星推演</button>
                    </div>
                  `;
                });
                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <h3 style="margin-top:0;">选择一位需要逆演命盘的人物</h3>
                  <div style="margin-top:20px;">${listHTML}</div>
                `;
              }
              // == 独立推演全屏详情页 ==
              else if (state.subPage === "generate-detail") {
                const cid = state.selectedCharId;
                const ch = chars.find(x => x.id === cid);
                const r = state.roles[cid] || {};

                let npcsHTML = "";
                if (r.npcs && r.npcs.length > 0) {
                  r.npcs.forEach(n => {
                    npcsHTML += `
                      <div class="sc-info-card" style="border-left-color:#777; margin:6px 0;">
                        <strong>${n.name}</strong> <small>(${n.relation})</small>
                        <p style="margin:4px 0 0 0; font-size:12.5px; color:#555;">${n.description}</p>
                      </div>
                    `;
                  });
                } else {
                  npcsHTML = `<p style="color:#888;">目前暂无该角色的随属人际关系谱系。</p>`;
                }

                mainContent = `
                  <div class="sc-back-action" data-action="go-sub" data-id="generate-list">⬅ 返回推演总表</div>
                  <div class="sc-card">
                    <h3 style="margin-top:0; color:#9c2a3a;">天盘推演详情：【${ch?.handle || ch?.name}】</h3>
                    <button class="sc-btn" data-action="generate-bg">开始演绎该角色命星经历</button>
                    
                    <div style="margin-top:20px;">
                      <strong>推导的古代大背景渊源：</strong>
                      <div class="sc-info-card">
                        <div class="sc-info-tag">生平家世大档案</div>
                        ${r.background || "暂无生平推导。点击上方按钮让天命演绎家世渊源。"}
                      </div>
                    </div>
                    <div style="margin-top:20px;">
                      <strong>伴生随从亲信人物谱 (NPC)：</strong>
                      <div style="margin-top:10px;">${npcsHTML}</div>
                    </div>
                  </div>
                `;
              }
              // == 批奏折主控 ==
              else if (state.subPage === "memorial-dashboard") {
                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <div class="sc-card" style="text-align:center; padding:40px;">
                    <h3 style="margin-top:0;">通政使呈送机要</h3>
                    <p style="color:#666; margin-bottom:24px;">全国各道府郡衙、六部、以及掖庭宫中，皆有可能呈送上报秘密本章折子。</p>
                    <button class="sc-btn" data-action="fetch-petition">宣召折子上殿批阅</button>
                  </div>
                `;
              }
              // == 独立全屏奏章阅览页 ==
              else if (state.subPage === "memorial-detail") {
                mainContent = `
                  <div class="sc-back-action" data-action="go-sub" data-id="memorial-dashboard">⬅ 放回通政署</div>
                  <div class="sc-card" style="border-left:4px solid #9c2a3a; padding:32px;">
                    <h3 style="margin-top:0; color:#9c2a3a;">【奉呈御奏折本】</h3>
                    <div class="sc-info-card" style="margin:20px 0;">
                      <div class="sc-info-tag">呈奏官职姓名：${state.currentPetition?.sender || "奉表人加载中"}</div>
                      <p style="font-size:15px; font-family:serif; line-height:1.8; letter-spacing:1px; color:#1a1a1a;">
                        “ ${state.currentPetition?.content || "正在快马加急开封火漆印信..."} ”
                      </p>
                    </div>
                    ${state.currentPetition && state.currentPetition.sender !== "呈递中..." ? `
                      <div style="display:flex; gap:12px; margin-top:24px; border-top:1px solid #eaeaea; padding-top:20px;">
                        <button class="sc-btn" data-action="handle-petition" data-id="approve">朱批：准奏</button>
                        <button class="sc-btn-secondary" data-action="handle-petition" data-id="table">留中不发 (压置暖阁)</button>
                        <button class="sc-btn-secondary" style="color:#b33;" data-action="handle-petition" data-id="reject">退回，责成重议</button>
                      </div>
                    ` : ""}
                  </div>
                `;
              }
              // == 奏章批阅朱批全屏反馈 ==
              else if (state.subPage === "memorial-result") {
                mainContent = `
                  <div class="sc-back-action" data-action="go-sub" data-id="memorial-dashboard">⬅ 回通政署</div>
                  <div class="sc-card">
                    <h3 style="margin-top:0; color:#2a9c4a;">朱批拟旨下达结果</h3>
                    <div class="sc-info-card" style="background:#f4f9f4; border-left-color:#2a9c4a;">
                      <div class="sc-info-tag" style="color:#2a9c4a;">圣谕波澜反馈</div>
                      ${state.petitionResult}
                    </div>
                  </div>
                `;
              }
              // == 后宫妃嫔列表 ==
              else if (state.subPage === "harem-list") {
                const list = Object.entries(state.roles).filter(([_, r]) => r.type === "harem");
                let listHTML = "";
                list.forEach(([cid, r]) => {
                  const ch = chars.find(x => x.id === cid);
                  if (!ch) return;
                  listHTML += `
                    <div class="sc-item-row">
                      <div>
                        <strong>${ch.handle || ch.name}</strong>
                        <span style="font-size:11.5px; background:#f4e8e9; color:#9c2a3a; padding:2px 8px; border-radius:4px; margin-left:12px;">位份：${r.rank}</span>
                      </div>
                      <button class="sc-btn" style="padding:6px 14px; font-size:13px;" data-action="go-harem-detail" data-id="${cid}">驾临召见</button>
                    </div>
                  `;
                });
                if (list.length === 0) listHTML = `<p style="color:#888; text-align:center;">掖庭宫苑尚无佳丽入住。请往【选秀大典】遴选。</p>`;

                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <h3 style="margin-top:0;">掖庭宫苑：佳丽妃嫔总册</h3>
                  <div style="margin-top:20px;">${listHTML}</div>
                `;
              }
              // == 后宫妃嫔单独管理全屏页 ==
              else if (state.subPage === "harem-detail") {
                const cid = state.selectedCharId;
                const ch = chars.find(x => x.id === cid);
                const r = state.roles[cid] || { rank: "在野" };

                mainContent = `
                  <div class="sc-back-action" data-action="go-sub" data-id="harem-list">⬅ 返回掖庭总册</div>
                  <div class="sc-card">
                    <h3 style="margin-top:0; color:#9c2a3a;">驾临【${ch?.handle || ch?.name}】寝宫</h3>
                    
                    <div class="sc-info-card">
                      <div class="sc-info-tag">家世渊源底册</div>
                      ${r.background || "良家子弟，未推演身世。"}
                    </div>

                    <div style="margin-top:24px; border-top:1px solid #eaeaea; padding-top:20px; display:flex; flex-direction:column; gap:16px;">
                      <div style="display:flex; gap:12px; align-items:center;">
                        <label style="font-size:13px; font-weight:bold;">更晋/降免其位份：</label>
                        <select id="rank-select-harem-detail" class="sc-select" style="width:140px;">
                          ${haremRanks.map(hr => `<option value="${hr}" ${r.rank === hr ? "selected" : ""}>${hr}</option>`).join("")}
                        </select>
                        <button class="sc-btn" style="padding:8px 16px;" data-action="harem-rank-change">改封</button>
                      </div>
                      <div style="display:flex; gap:12px; margin-top:10px;">
                        <button class="sc-btn" data-action="launch-stay">翻牌留宿（进入对话交互）</button>
                        <button class="sc-btn-secondary" style="color:#b33;" data-action="dismiss-role-detail">褫夺封号，革出名册</button>
                      </div>
                    </div>
                  </div>
                `;
              }
              // == 朝臣列表 ==
              else if (state.subPage === "court-list") {
                const list = Object.entries(state.roles).filter(([_, r]) => r.type === "court");
                let listHTML = "";
                list.forEach(([cid, r]) => {
                  const ch = chars.find(x => x.id === cid);
                  if (!ch) return;
                  listHTML += `
                    <div class="sc-item-row">
                      <div>
                        <strong>${ch.handle || ch.name}</strong>
                        <span style="font-size:11.5px; background:#e5eff5; color:#2a7a9c; padding:2px 8px; border-radius:4px; margin-left:12px;">官位：${r.rank}</span>
                      </div>
                      <button class="sc-btn" style="padding:6px 14px; font-size:13px;" data-action="go-court-detail" data-id="${cid}">传宣密会</button>
                    </div>
                  `;
                });
                if (list.length === 0) listHTML = `<p style="color:#888; text-align:center;">暖阁清冷，尚无授官官员。请前去【御前科考】擢拔。</p>`;

                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <h3 style="margin-top:0;">阁署殿阁：内阁辅政百僚册</h3>
                  <div style="margin-top:20px;">${listHTML}</div>
                `;
              }
              // == 辅臣单独管理全屏页 ==
              else if (state.subPage === "court-detail") {
                const cid = state.selectedCharId;
                const ch = chars.find(x => x.id === cid);
                const r = state.roles[cid] || { rank: "在野" };

                mainContent = `
                  <div class="sc-back-action" data-action="go-sub" data-id="court-list">⬅ 返回辅臣名册</div>
                  <div class="sc-card">
                    <h3 style="margin-top:0; color:#316a8d;">御书房召见：【${ch?.handle || ch?.name}】</h3>
                    
                    <div class="sc-info-card">
                      <div class="sc-info-tag">臣工履历卷宗</div>
                      ${r.background || "白衣士子，未推演仕途身世背景。"}
                    </div>

                    <div style="margin-top:24px; border-top:1px solid #eaeaea; padding-top:20px; display:flex; flex-direction:column; gap:16px;">
                      <div style="display:flex; gap:12px; align-items:center;">
                        <label style="font-size:13px; font-weight:bold;">转迁/升贬朝廷官爵：</label>
                        <select id="rank-select-court-detail" class="sc-select" style="width:160px;">
                          ${courtRanks.map(cr => `<option value="${cr}" ${r.rank === cr ? "selected" : ""}>${cr}</option>`).join("")}
                        </select>
                        <button class="sc-btn" style="padding:8px 16px; background:#316a8d;" data-action="court-rank-change">调迁升迁</button>
                      </div>
                      <div style="display:flex; gap:12px; margin-top:10px;">
                        <button class="sc-btn" style="background:#316a8d;" data-action="launch-talk">于暖阁进行密谈对话</button>
                        <button class="sc-btn-secondary" style="color:#b33;" data-action="dismiss-role-detail">革除名册，罢其官印</button>
                      </div>
                    </div>
                  </div>
                `;
              }
              // == 王朝编辑 ==
              else if (state.subPage === "majesty-edit") {
                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回国事</div>
                  <div class="sc-card" style="max-width:500px;">
                    <h3 style="margin-top:0; color:#9c2a3a;">天子改元更朝名号</h3>
                    <div style="display:flex; flex-direction:column; gap:14px; margin-top:20px;">
                      <div>
                        <label style="font-size:12px; font-weight:bold; display:block; margin-bottom:4px;">国名国号：</label>
                        <input type="text" id="dynasty-state" class="sc-input" value="${state.dynasty.stateName}">
                      </div>
                      <div>
                        <label style="font-size:12px; font-weight:bold; display:block; margin-bottom:4px;">君王年号：</label>
                        <input type="text" id="dynasty-era" class="sc-input" value="${state.dynasty.eraName}">
                      </div>
                      <div>
                        <label style="font-size:12px; font-weight:bold; display:block; margin-bottom:4px;">天子专属自称面具：</label>
                        <input type="text" id="dynasty-title" class="sc-input" value="${state.dynasty.userTitle}">
                      </div>
                      <button class="sc-btn" data-action="save-majesty">颁谕旨，修订改更</button>
                    </div>
                  </div>
                `;
              }
            }

            // ================== TAB: 执政录 ==================
            else if (state.activeTab === "sessions") {
              if (state.subPage === "chat") {
                const session = state.sessions.find(s => s.id === state.activeSessionId);
                if (!session) {
                  mainContent = `<p style="text-align:center; padding:30px; color:#888;">暂无会话，请点击下方标签重返执政录。</p>`;
                } else {
                  const ch = chars.find(x => x.id === session.charId);
                  const r = state.roles[session.charId] || { rank: "在野", background: "", npcs: [] };

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
                        <div class="sc-info-card" style="border-left-color:#777; padding:8px 12px; margin:6px 0; font-size:12px;">
                          <strong>${n.name}</strong> <small>(${n.relation})</small>
                          <p style="margin:4px 0 0 0; color:#555; font-size:11.5px;">${n.description}</p>
                        </div>
                      `;
                    });
                  } else {
                    npcsHTML = `<div style="font-size:12px; color:#888;">该角色暂无其他连带随从关系。</div>`;
                  }

                  mainContent = `
                    <div class="sc-back-action" data-action="go-sub" data-id="dashboard">⬅ 结束，退回执政录</div>
                    <div class="sc-chat-grid">
                      <div class="sc-chat-aside">
                        <h4 style="margin:0 0 10px 0; color:#9c2a3a;">【君臣妃嫔会商底档】</h4>
                        <div style="font-size:13px; line-height:1.4; margin-bottom:12px;">
                          <strong>姓名：</strong>${ch?.name}<br>
                          <strong>位份/职位：</strong>${r.rank}
                        </div>
                        <div class="sc-info-card" style="padding:10px 14px; font-size:12.5px;">
                          <div class="sc-info-tag">生平家世</div>
                          ${r.background || "良民"}
                        </div>
                        <h5 style="margin:12px 0 6px 0; font-size:12.5px; color:#555;">伴生NPC关系人：</h5>
                        ${npcsHTML}
                      </div>
                      <div class="sc-chat-room">
                        <div class="sc-chat-history" id="sc-chat-scroller">
                          ${msgsHTML}
                        </div>
                        <div class="sc-chat-input-area">
                          <input type="text" id="sc-chat-input" class="sc-input" placeholder="输入陛下圣意长叙..." onkeydown="if(event.key==='Enter') { document.querySelector('[data-action=\\'send-chat\\']').click(); }">
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
                let sHTML = "";
                state.sessions.forEach(s => {
                  const ch = chars.find(x => x.id === s.charId);
                  const r = state.roles[s.charId] || { rank: "在野" };
                  if (!ch) return;
                  sHTML += `
                    <div class="sc-item-row">
                      <div>
                        <strong>${s.type === "stay" ? "【夜宿深宫】" : "【暖阁密会】"} ${ch.handle || ch.name}</strong>
                        <span style="font-size:11px; background:#f4e8e9; color:#9c2a3a; padding:2px 8px; border-radius:4px; margin-left:12px;">${r.rank}</span>
                      </div>
                      <div style="display:flex; gap:10px;">
                        <button class="sc-btn" style="padding:6px 14px; font-size:13px;" data-action="go-page" data-id="chat" onclick="window.shangchao_activeSessionId='${s.id}'" data-sess-injector="${s.id}">驾临对话</button>
                        <button class="sc-btn-secondary" style="padding:6px 14px; font-size:13px; color:#b33;" data-action="delete-session" data-id="${s.id}">结束</button>
                      </div>
                    </div>
                  `;
                });
                if (state.sessions.length === 0) {
                  sHTML = `<p style="color:#888; text-align:center; padding:40px;">当前本朝没有正在进行中的任何留宿长夜叙或暖阁秘谋会谈。</p>`;
                }

                mainContent = `
                  <div class="sc-page-header">
                    <div class="sc-title">执政录 <span>长夜密议</span></div>
                  </div>
                  <div>${sHTML}</div>
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

            // ================== TAB: 卷宗 ==================
            else if (state.activeTab === "archives") {
              if (state.subPage === "archive-edit") {
                const cid = state.selectedCharId;
                const ch = chars.find(x => x.id === cid);
                const r = state.roles[cid] || { type: null, rank: "百姓", background: "", npcs: [] };

                let npcsHTML = "";
                (r.npcs || []).forEach((n, idx) => {
                  npcsHTML += `
                    <div class="npc-row-${cid}-${idx}" style="display:flex; gap:8px; margin-bottom:10px; align-items:center;">
                      <input type="text" class="sc-input npc-name" style="width:100px; padding:6px; font-size:13px;" value="${n.name}" placeholder="姓名">
                      <input type="text" class="sc-input npc-rel" style="width:100px; padding:6px; font-size:13px;" value="${n.relation}" placeholder="关系">
                      <input type="text" class="sc-input npc-desc" style="width:280px; padding:6px; font-size:13px;" value="${n.description}" placeholder="身家背景描述">
                      <button class="sc-btn" style="padding:6px 12px; font-size:12px;" data-action="save-npc" data-id="${cid}::${idx}">存</button>
                      <button class="sc-btn-secondary" style="padding:6px 12px; font-size:12px; color:#b33;" data-action="delete-npc" data-id="${cid}::${idx}">删</button>
                    </div>
                  `;
                });

                mainContent = `
                  <div class="sc-back-action" data-action="back-dash">⬅ 返回卷宗名册</div>
                  <div class="sc-card">
                    <h3 style="margin-top:0; color:#9c2a3a;">修编起居卷宗：【${ch?.handle || ch?.name}】</h3>
                    <span style="font-size:11px; background:#eaeaea; color:#444; padding:2px 8px; border-radius:4px;">
                      ${r.type === "harem" ? "后宫" : r.type === "court" ? "朝廷" : "在野"} · ${r.rank}
                    </span>
                    
                    <div style="margin-top:20px;">
                      <label style="font-size:13px; font-weight:bold; display:block; margin-bottom:6px;">生平家世大档案背景（文本框）：</label>
                      <textarea id="archive-bg-${cid}" class="sc-textarea" rows="3" style="line-height:1.6;">${r.background || ""}</textarea>
                      <button class="sc-btn-secondary" style="padding:6px 14px; font-size:12.5px; border:1px solid #ddd; margin-top:8px;" data-action="save-archive" data-id="${cid}">修存背景档案</button>
                    </div>

                    <div style="margin-top:24px; border-top:1px solid #eaeaea; padding-top:20px;">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <span style="font-size:13px; font-weight:bold;">随行NPC亲近人脉网（上限5人）：</span>
                        <button class="sc-btn" style="padding:6px 12px; font-size:12px;" data-action="add-npc" data-id="${cid}">+ 新增随属</button>
                      </div>
                      ${npcsHTML}
                    </div>
                  </div>
                `;
              } else {
                let listHTML = "";
                chars.forEach(c => {
                  const r = state.roles[c.id] || { type: null, rank: "在野" };
                  listHTML += `
                    <div class="sc-item-row">
                      <div>
                        <strong>${c.handle || c.name}</strong>
                        <span style="font-size:11px; background:#f4f4f4; color:#666; padding:2px 8px; border-radius:4px; margin-left:12px;">
                          ${r.type === "harem" ? "后宫" : r.type === "court" ? "朝廷" : "在野"} · ${r.rank}
                        </span>
                      </div>
                      <button class="sc-btn" style="padding:6px 14px; font-size:13px;" data-action="go-archive-edit" data-id="${c.id}">进入编辑密卷</button>
                    </div>
                  `;
                });
                if (chars.length === 0) listHTML = `<p style="color:#888; text-align:center;">暂无宿主角色，请先创建角色。</p>`;

                mainContent = `
                  <div class="sc-page-header">
                    <div class="sc-title">内阁卷宗馆 <span>密疏修缮</span></div>
                  </div>
                  <p style="font-size:13px; color:#666; margin-bottom:15px;">此处专门用于对每一个角色的家世、生平文本以及连带 NPC 随从信息进行无 AI 偏误、完全精准的手工艺编纂。</p>
                  <div>${listHTML}</div>
                `;
              }
            }

            // ================== Shell 组装 ==================
            rootEl.innerHTML = `
              <div class="sc-shell">
                <div class="sc-main-view">
                  ${mainContent}
                </div>
                
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