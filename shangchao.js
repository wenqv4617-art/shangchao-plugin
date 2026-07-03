(function () {
  const PLUGIN_ID = "shangchao-plugin";
  const APP_ID = "shangchao-home";
  const STORAGE_KEY = "shangchao_state_v1";

  // 默认数据状态
  const defaultState = {
    dynasty: {
      stateName: "大昭",
      eraName: "景和",
      userTitle: "朕"
    },
    roles: {}, // charId -> { type: 'harem'|'court'|null, rank: string, background: string, npcs: Array }
    sessions: [], // Array of { id, charId, type: 'stay'|'talk', messages: Array }
    currentPage: "main",
    activeSessionId: null,
    selectedCharId: null,
    examQuestion: "今水旱不均，国库渐虚，何策可使百姓丰登、朝廷殷实？",
    examAnswers: {}, // charId -> text
    draftSpeech: "",
    currentPetition: null,
    petitionResult: ""
  };

  // 临时运行时变量（不存入 storage，但在 unmount 时需要清理）
  let uiListeners = [];
  let currentContainer = null;

  // 辅助函数：安全解析 JSON
  function parseJSON(text, fallback) {
    try {
      // 移除可能的 Markdown 包裹符号
      const clean = text.replace(/```json/gi, "").replace(/```/gi, "").trim();
      return JSON.parse(clean);
    } catch (e) {
      console.error("JSON 解析失败:", e, text);
      return fallback;
    }
  }

  // 常用中国风名号预设
  const haremRanks = ["皇后", "贵妃", "贤妃", "淑妃", "德妃", "婕妤", "贵人", "美人", "常在", "答应"];
  const courtRanks = ["首辅", "大学士", "尚书", "侍郎", "御史中丞", "大理寺卿", "知府", "翰林学士"];

  window.RochePlugin.register({
    id: PLUGIN_ID,
    name: "上朝！",
    version: "1.0.0",
    apps: [
      {
        id: APP_ID,
        name: "上朝！",
        icon: "gavel",
        async mount(container, roche) {
          currentContainer = container;

          // 1. 读取并合并持久化数据
          let savedState = {};
          try {
            savedState = (await roche.storage.get(STORAGE_KEY)) || {};
          } catch (e) {
            console.error("读取上朝插件数据失败:", e);
          }
          const state = { ...defaultState, ...savedState };
          state.dynasty = { ...defaultState.dynasty, ...savedState.dynasty };

          // 2. 注入独立局部 CSS 样式
          const styleEl = document.createElement("style");
          styleEl.id = "shangchao-plugin-css";
          styleEl.innerHTML = `
            .roche-plugin-shangchao {
              font-family: "PingFang SC", "Hiragino Sans GB", "STHeiti", serif;
              background-color: #faf7f0;
              color: #2b2b2b;
              width: 100%;
              height: 100%;
              overflow-y: auto;
              box-sizing: border-box;
              padding: 24px;
              line-height: 1.6;
            }
            .roche-plugin-shangchao * {
              box-sizing: border-box;
            }
            /* 卷轴宣纸质感容器 */
            .sc-container {
              max-width: 1000px;
              margin: 0 auto;
              background: #fdfcf8;
              border: 1px solid #dcd7c9;
              box-shadow: 0 4px 16px rgba(43, 33, 22, 0.08);
              border-radius: 4px;
              padding: 32px;
              position: relative;
            }
            .sc-header {
              text-align: center;
              border-bottom: 2px dashed #dcd7c9;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .sc-title {
              font-size: 28px;
              color: #8b2635;
              margin: 8px 0;
              font-weight: bold;
              letter-spacing: 4px;
            }
            .sc-badge {
              display: inline-block;
              background: #8b2635;
              color: #ffffff;
              font-size: 13px;
              padding: 2px 10px;
              border-radius: 2px;
              letter-spacing: 1px;
            }
            /* 卡片区 */
            .sc-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              gap: 20px;
              margin-top: 24px;
            }
            .sc-card {
              background: #fcfbfa;
              border: 1px solid #eae5da;
              border-radius: 4px;
              padding: 20px;
              cursor: pointer;
              transition: all 0.25s ease;
              box-shadow: 0 2px 6px rgba(0,0,0,0.01);
            }
            .sc-card:hover {
              border-color: #8b2635;
              background: #fdfbf7;
              transform: translateY(-2px);
              box-shadow: 0 4px 10px rgba(139, 38, 53, 0.08);
            }
            .sc-card-title {
              font-size: 18px;
              color: #8b2635;
              margin-bottom: 8px;
              font-weight: bold;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .sc-card-desc {
              font-size: 13px;
              color: #666;
            }
            /* 按钮 */
            .sc-btn {
              background: #8b2635;
              color: #fff;
              border: 1px solid #701c27;
              padding: 8px 16px;
              font-size: 14px;
              cursor: pointer;
              border-radius: 2px;
              transition: all 0.2s;
            }
            .sc-btn:hover {
              background: #a32d3e;
            }
            .sc-btn-secondary {
              background: #eae4d8;
              color: #5a5449;
              border: 1px solid #c8bfae;
              padding: 8px 16px;
              font-size: 14px;
              cursor: pointer;
              border-radius: 2px;
            }
            .sc-btn-secondary:hover {
              background: #dfd8cb;
            }
            /* 表单与输入 */
            .sc-input, .sc-textarea, .sc-select {
              width: 100%;
              background: #faf9f6;
              border: 1px solid #dcd7c9;
              padding: 8px 12px;
              color: #2b2b2b;
              font-size: 14px;
              outline: none;
              border-radius: 2px;
            }
            .sc-input:focus, .sc-textarea:focus, .sc-select:focus {
              border-color: #8b2635;
            }
            /* 列表与行 */
            .sc-list-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px;
              border-bottom: 1px solid #eae5da;
            }
            /* 页面回退/顶部栏 */
            .sc-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 1px dashed #dcd7c9;
            }
            .sc-back {
              display: flex;
              align-items: center;
              cursor: pointer;
              color: #8b2635;
              font-weight: bold;
              gap: 6px;
            }
            /* 双栏布局 */
            .sc-layout-split {
              display: grid;
              grid-template-columns: 280px 1fr;
              gap: 24px;
            }
            /* 对话视窗 */
            .sc-chat-area {
              display: flex;
              flex-direction: column;
              height: 500px;
              border: 1px solid #dcd7c9;
              background: #faf9f5;
              border-radius: 4px;
            }
            .sc-chat-history {
              flex: 1;
              overflow-y: auto;
              padding: 16px;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .sc-msg {
              max-width: 80%;
              padding: 10px 14px;
              border-radius: 4px;
              font-size: 14px;
              word-break: break-all;
            }
            .sc-msg.sys {
              align-self: center;
              background: #eae4d8;
              color: #7a6e5a;
              font-size: 12px;
              max-width: 90%;
            }
            .sc-msg.user {
              align-self: flex-end;
              background: #8b2635;
              color: #ffffff;
            }
            .sc-msg.assistant {
              align-self: flex-start;
              background: #f1ebd9;
              color: #2b2b2b;
              border: 1px solid #eae5da;
            }
            .sc-chat-input-bar {
              display: flex;
              border-top: 1px solid #dcd7c9;
              padding: 12px;
              gap: 8px;
              background: #fcfbfa;
            }
            /* 卷宗状态卡 */
            .sc-char-row {
              background: #f8f6f0;
              border: 1px solid #eae5da;
              padding: 12px;
              margin-bottom: 10px;
              border-radius: 3px;
            }
            .sc-loading {
              color: #8b2635;
              font-style: italic;
              text-align: center;
              padding: 20px;
            }
          `;
          container.appendChild(styleEl);

          // 3. 构建宿主 DOM 根节点
          const rootEl = document.createElement("div");
          rootEl.className = "roche-plugin-shangchao";
          container.appendChild(rootEl);

          // 4. 数据更新逻辑
          async function updateState(patch) {
            Object.assign(state, patch);
            try {
              await roche.storage.set(STORAGE_KEY, state);
            } catch (e) {
              console.error("保存数据失败:", e);
            }
            await render();
          }

          // 5. 事件委托监听（在 unmount 中需解绑）
          const onClick = async (e) => {
            const target = e.target;
            const action = target.getAttribute("data-action") || target.closest("[data-action]")?.getAttribute("data-action");
            const argId = target.getAttribute("data-id") || target.closest("[data-id]")?.getAttribute("data-id");

            if (!action) return;

            // 导航操作
            if (action === "go-page") {
              await updateState({ currentPage: argId, draftSpeech: "", petitionResult: "" });
              return;
            }
            if (action === "go-back") {
              await updateState({ currentPage: "main", draftSpeech: "", petitionResult: "" });
              return;
            }

            // A. 选秀大典操作
            if (action === "summon-draft") {
              // 召唤选秀台词
              const chars = await roche.character.list();
              const char = chars.find(c => c.id === argId);
              if (!char) return;
              await updateState({ selectedCharId: argId, draftSpeech: "召唤中..." });

              const prompt = `你是角色【${char.name}】（人设简述：${char.persona || char.bio || ""}）。
              当前正处于大选之中，你需要向皇上（用户）发表一段自荐参选并恳请封赏的言论。
              请注意用词举止，以契合人设。字数80字以内，使用典雅的古风白话，不要携带任何Markdown标记，直接扮演。`;

              try {
                const res = await roche.ai.chat({
                  messages: [{ role: "user", content: prompt }]
                });
                await updateState({ draftSpeech: res.text });
              } catch (err) {
                roche.ui.toast("AI 沟通受阻：" + err.message);
                await updateState({ draftSpeech: "臣子在殿外长跪，唯愿求得天恩垂青。" });
              }
            }

            if (action === "appoint-harem") {
              const rankInput = rootEl.querySelector("#draft-rank-select");
              const selectedRank = rankInput ? rankInput.value : "贵人";
              const charId = state.selectedCharId;
              const curRole = state.roles[charId] || {};
              const roles = { ...state.roles };
              roles[charId] = {
                ...curRole,
                type: "harem",
                rank: selectedRank
              };
              roche.ui.toast("已册封佳丽");
              await updateState({ roles, currentPage: "harem", selectedCharId: null, draftSpeech: "" });
            }

            // B. 科考操作
            if (action === "start-exam") {
              const question = rootEl.querySelector("#exam-q-input")?.value || "";
              const checkedBoxes = rootEl.querySelectorAll(".exam-candidate-check:checked");
              if (checkedBoxes.length === 0) {
                roche.ui.toast("请至少选择一位应试举人");
                return;
              }
              const activeCandidates = Array.from(checkedBoxes).map(cb => cb.value);

              await updateState({ examQuestion: question, examAnswers: { status: "loading" } });

              const answers = {};
              const chars = await roche.character.list();

              for (const cid of activeCandidates) {
                const char = chars.find(c => c.id === cid);
                const charPersona = char ? (char.persona || char.bio || "") : "";
                const prompt = `你是角色【${char?.name || ""}】。当前，你正在金銮殿上参与天子御前殿试。
                考题为：『${question}』。
                请结合你的人设和学识（${charPersona}），呈送一份答卷。
                字数150字内，风格古朴雅致，不可带有Markdown标签，请直接书写策论回答。`;

                try {
                  const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                  answers[cid] = res.text;
                } catch (e) {
                  answers[cid] = "臣突染微恙，未能流畅作答，惶恐至极。";
                }
              }

              await updateState({ examAnswers: answers });
            }

            if (action === "appoint-court") {
              const cid = argId;
              const selectRankEl = rootEl.querySelector(`#court-rank-select-${cid}`);
              const rank = selectRankEl ? selectRankEl.value : "翰林学士";
              const curRole = state.roles[cid] || {};
              const roles = { ...state.roles };
              roles[cid] = {
                ...curRole,
                type: "court",
                rank: rank
              };
              roche.ui.toast("已敕封授官");
              await updateState({ roles, currentPage: "study", examAnswers: {} });
            }

            // C. 推演生平
            if (action === "generate-bg") {
              const cid = argId;
              const chars = await roche.character.list();
              const char = chars.find(c => c.id === cid);
              if (!char) return;

              roche.ui.toast("推演天命星盘中...");
              const prompt = `你现在是古代人物背景演绎生成器。请为角色【${char.name}】（生平：${char.persona || char.bio || ""}）推演一套大秦/大汉/大唐背景的角色背景和身边社会关系网。
              必须输出一个严格合法的 JSON 对象，不要包含 Markdown 标记（不要用三个反引号包裹），直接输出 JSON 内容本身，格式如下：
              {
                "background": "此处书写200字左右生平，说明其家世背景，朝野门阀纠葛等。",
                "npcs": [
                  { "name": "沈老爷", "relation": "亲生父亲", "description": "礼部尚书，朝野中德高望重" },
                  { "name": "阿环", "relation": "贴身侍女", "description": "聪明乖巧，自幼陪伴在其身侧" }
                ]
              }
              最多可生成5个NPC。`;

              try {
                const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                const parsed = parseJSON(res.text, { background: "推演出现谜团，出身于神秘隐世宗族。", npcs: [] });
                const roles = { ...state.roles };
                roles[cid] = {
                  ...(roles[cid] || {}),
                  background: parsed.background,
                  npcs: parsed.npcs || []
                };
                roche.ui.toast("天演卷宗生成成功");
                await updateState({ roles });
              } catch (e) {
                roche.ui.toast("神算天机未卜：" + e.message);
              }
            }

            // D. 批阅奏折
            if (action === "fetch-petition") {
              await updateState({ currentPetition: { sender: "呈送中...", content: "驿马飞驰，奏折正加急入京..." }, petitionResult: "" });
              const chars = await roche.character.list();
              const activeRolesStr = Object.entries(state.roles)
                .map(([cid, r]) => {
                  const c = chars.find(x => x.id === cid);
                  return c ? `${c.name}(${r.type === "harem" ? "后宫" : "朝堂"}-${r.rank})` : "";
                })
                .filter(Boolean)
                .join("、");

              const prompt = `当前模拟王朝为：${state.dynasty.stateName}，年号为：${state.dynasty.eraName}。
              朝堂及后宫人物有：${activeRolesStr || "民间群僚"}。
              请帮我生成一封呈给皇帝的奏折，可以是臣子弹劾、汇报地方民情，或者是嫔妃邀宠、娘家引荐，甚至是NPC亲属越级上书。
              返回数据格式必须是严格的 JSON ，不需任何Markdown包裹，格式如下：
              {
                "sender": "奏折呈报人姓名与职位（如：户部侍郎 某某 或 贤妃 某某）",
                "content": "奏折陈述内容（150字以内，采用古雅、尊崇的奏章口吻）"
              }`;

              try {
                const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                const parsed = parseJSON(res.text, { sender: "内阁司礼监", content: "天下太平，百官恭贺吾皇万岁。惟有地方仓廪空虚，宜提早筹划。" });
                await updateState({ currentPetition: parsed });
              } catch (e) {
                await updateState({ currentPetition: { sender: "通政司司礼官", content: "边关无事，内阁阁臣正在理政，请陛下宽心。" } });
              }
            }

            if (action === "handle-petition") {
              const decision = argId; // 'approve', 'table', 'reject'
              if (!state.currentPetition) return;

              const descMap = { approve: "准奏", table: "留中", reject: "驳回" };
              const prompt = `奏折来自：【${state.currentPetition.sender}】。
              奏折内容：『${state.currentPetition.content}』。
              皇帝（用户）对该奏折的处理决定为：【${descMap[decision]}】。
              请作为皇家历史记录官，以旁白的角度写一段该朱批决定对后宫、朝堂或者天下局势造成的影响。
              字数80字内，古风叙事。不要带任何Markdown标签。`;

              await updateState({ petitionResult: "司礼监拟旨中..." });
              try {
                const res = await roche.ai.chat({ messages: [{ role: "user", content: prompt }] });
                await updateState({ petitionResult: res.text, currentPetition: null });
              } catch (e) {
                await updateState({ petitionResult: `陛下已行【${descMap[decision]}】之权，朝野各部领旨遵办。`, currentPetition: null });
              }
            }

            // E. 后宫与御书房召见（留宿与密谈）
            if (action === "harem-rank-change") {
              const cid = argId;
              const rankInput = rootEl.querySelector(`#rank-select-harem-${cid}`);
              if (!rankInput) return;
              const roles = { ...state.roles };
              roles[cid].rank = rankInput.value;
              roche.ui.toast("已改封佳丽位份");
              await updateState({ roles });
            }

            if (action === "court-rank-change") {
              const cid = argId;
              const rankInput = rootEl.querySelector(`#rank-select-court-${cid}`);
              if (!rankInput) return;
              const roles = { ...state.roles };
              roles[cid].rank = rankInput.value;
              roche.ui.toast("已改封臣子官职");
              await updateState({ roles });
            }

            if (action === "dismiss-role") {
              const cid = argId;
              const ok = await roche.ui.confirm({ title: "罢黜恩典", message: "确定要罢免其在王朝里的一切封位并逐出名录吗？" });
              if (!ok) return;
              const roles = { ...state.roles };
              delete roles[cid];
              roche.ui.toast("已革除其官司封位");
              await updateState({ roles });
            }

            // 留宿
            if (action === "launch-stay") {
              const cid = argId;
              let session = state.sessions.find(s => s.charId === cid && s.type === "stay");
              if (!session) {
                const chars = await roche.character.list();
                const char = chars.find(c => c.id === cid);
                const r = state.roles[cid];
                session = {
                  id: "sess_" + Date.now(),
                  charId: cid,
                  type: "stay",
                  messages: [
                    { role: "system", text: `【大礼起驾】春寒赐浴，明烛夜深。皇帝今宵翻了【${r.rank} · ${char.handle || char.name}】的寝牌，移驾寝宫，长叙留宿。` }
                  ]
                };
                const sessions = [...state.sessions, session];
                await updateState({ sessions, activeSessionId: session.id, currentPage: "chat" });
              } else {
                await updateState({ activeSessionId: session.id, currentPage: "chat" });
              }
            }

            // 密谈
            if (action === "launch-talk") {
              const cid = argId;
              let session = state.sessions.find(s => s.charId === cid && s.type === "talk");
              if (!session) {
                const chars = await roche.character.list();
                const char = chars.find(c => c.id === cid);
                const r = state.roles[cid];
                session = {
                  id: "sess_" + Date.now(),
                  charId: cid,
                  type: "talk",
                  messages: [
                    { role: "system", text: `【御书房召见】红烛高悬，大局倥偬。皇帝特召【${r.rank} · ${char.handle || char.name}】入暖阁，摒退左右，秘密磋商朝廷重策。` }
                  ]
                };
                const sessions = [...state.sessions, session];
                await updateState({ sessions, activeSessionId: session.id, currentPage: "chat" });
              } else {
                await updateState({ activeSessionId: session.id, currentPage: "chat" });
              }
            }

            // 结束留宿/密谈
            if (action === "delete-session") {
              const sessId = argId;
              const ok = await roche.ui.confirm({ title: "撤驾", message: "要结束这场叙事面商吗？（聊天记录将清空）" });
              if (!ok) return;
              const sessions = state.sessions.filter(s => s.id !== sessId);
              await updateState({ sessions, currentPage: "sessions" });
            }

            // 发送对话消息
            if (action === "send-chat") {
              const inputEl = rootEl.querySelector("#sc-chat-input");
              const text = inputEl?.value.trim() || "";
              if (!text) return;

              inputEl.value = "";
              const sessId = state.activeSessionId;
              const session = state.sessions.find(s => s.id === sessId);
              if (!session) return;

              // 插入用户消息
              session.messages.push({ role: "user", text, timestamp: Date.now() });
              await updateState({ sessions: [...state.sessions] });

              // 调用 AI
              const chars = await roche.character.list();
              const char = chars.find(c => c.id === session.charId);
              const r = state.roles[session.charId] || { rank: "百姓", background: "", npcs: [] };

              const systemPrompt = `你现在是古代人物角色扮演模型。
              你扮演的角色是：【${char.name}】(昵称/字：${char.handle || ""})。
              人设特质如下：${char.persona || char.bio || ""}
              在当前的架空古代王朝【${state.dynasty.stateName}】（当前年号：【${state.dynasty.eraName}】）中，你获得的皇帝敕封身份为：【${r.rank}】。
              
              你的背景经历：${r.background || "自幼良家，恪守法纪，不曾有显赫之出身。"}
              你在世的亲属/随从羁绊：
              ${(r.npcs || []).map(n => `- ${n.name} (关系: ${n.relation}): ${n.description}`).join("\n")}

              当前交互场景：
              ${session.type === "stay" ? "深夜皇帝留宿寝宫，红烛暖帐中正在与你推心置腹地私下闲叙。" : "召见暖阁，君臣正在就朝政家国之事秘密研商。"}

              对话规范：
              1. 保持完全符合【${char.name}】人设的对话态度（深情、谦卑、野心或机智等），根据你的阶级地位，注意合乎情理的称谓（如：臣妾、微臣、吾皇、陛下）。
              2. 绝对不可脱离角色扮演，千万不要提到“AI”、“大语言模型”等字眼。
              3. 文字表达尽量精练且有古韵文言，字数严格控制在150字以内，不输出任何 Markdown 格式。`;

              const messagesForAI = [
                { role: "system", content: systemPrompt }
              ];
              session.messages.forEach(m => {
                if (m.role !== "system") {
                  messagesForAI.push({ role: m.role, content: m.text });
                }
              });

              try {
                // 占位消息
                session.messages.push({ role: "assistant", text: "低头思量中...", timestamp: Date.now() });
                await render();

                const aiRes = await roche.ai.chat({ messages: messagesForAI });
                session.messages.pop(); // 弹出占位
                session.messages.push({ role: "assistant", text: aiRes.text, timestamp: Date.now() });
                await updateState({ sessions: [...state.sessions] });
              } catch (err) {
                session.messages.pop();
                session.messages.push({ role: "assistant", text: "（陛下息怒，殿外似乎喧哗，臣（臣妾）一时间神情恍惚……）", timestamp: Date.now() });
                await updateState({ sessions: [...state.sessions] });
              }
            }

            // F. 圣颜信息
            if (action === "save-majesty") {
              const stateName = rootEl.querySelector("#dynasty-state")?.value || "大周";
              const eraName = rootEl.querySelector("#dynasty-era")?.value || "开元";
              const userTitle = rootEl.querySelector("#dynasty-title")?.value || "朕";
              await updateState({
                dynasty: { stateName, eraName, userTitle },
                currentPage: "main"
              });
              roche.ui.toast("圣旨已下，改元换号已成");
            }

            // G. 卷宗保存修改
            if (action === "save-archive") {
              const cid = argId;
              const bgInput = rootEl.querySelector(`#archive-bg-${cid}`);
              if (!bgInput) return;
              const roles = { ...state.roles };
              if (!roles[cid]) {
                roles[cid] = { type: null, rank: "", background: "", npcs: [] };
              }
              roles[cid].background = bgInput.value;
              roche.ui.toast("卷宗秘档修编完毕");
              await updateState({ roles });
            }

            if (action === "add-npc") {
              const cid = argId;
              const roles = { ...state.roles };
              if (!roles[cid]) {
                roles[cid] = { type: null, rank: "", background: "", npcs: [] };
              }
              roles[cid].npcs = roles[cid].npcs || [];
              if (roles[cid].npcs.length >= 5) {
                roche.ui.toast("至多录入五个连带随从/NPC");
                return;
              }
              roles[cid].npcs.push({ name: "无名氏", relation: "世交", description: "背景不详" });
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
              const roles = { ...state.roles };
              const row = rootEl.querySelector(`.npc-row-${cid}-${idx}`);
              if (row) {
                const name = row.querySelector(".npc-name")?.value || "";
                const relation = row.querySelector(".npc-rel")?.value || "";
                const description = row.querySelector(".npc-desc")?.value || "";
                roles[cid].npcs[parseInt(idx)] = { name, relation, description };
                roche.ui.toast("NPC 记录已修正");
                await updateState({ roles });
              }
            }
          };

          rootEl.addEventListener("click", onClick);
          uiListeners.push({ el: rootEl, type: "click", handler: onClick });

          // 6. 主渲染函数
          async function render() {
            if (!currentContainer) return;
            const chars = await roche.character.list();

            let contentHTML = "";

            switch (state.currentPage) {
              case "main":
                contentHTML = `
                  <div class="sc-header">
                    <span class="sc-badge">【${state.dynasty.stateName} · ${state.dynasty.eraName}】</span>
                    <h1 class="sc-title">上朝！</h1>
                    <p style="font-size:13px; color:#7a6e5a; font-style:italic;">—— 万机在握，江山如画。陛下，请临朝听政。 ——</p>
                  </div>
                  <div class="sc-grid">
                    <div class="sc-card" data-action="go-page" data-id="draft">
                      <div class="sc-card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        选秀大典
                      </div>
                      <div class="sc-card-desc">册选民间与重臣佳丽入驻后宫，聆听殿上自陈、敕受位份。</div>
                    </div>
                    <div class="sc-card" data-action="go-page" data-id="exam">
                      <div class="sc-card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        御前科考
                      </div>
                      <div class="sc-card-desc">开科取士。由君王亲自定题，考评答卷优劣，钦点授官。</div>
                    </div>
                    <div class="sc-card" data-action="go-page" data-id="generate">
                      <div class="sc-card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/></svg>
                        命盘推演
                      </div>
                      <div class="sc-card-desc">推算角色的身世羁绊，生成社会网络及亲眷密随（NPC）。</div>
                    </div>
                    <div class="sc-card" data-action="go-page" data-id="memorial">
                      <div class="sc-card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        批阅奏折
                      </div>
                      <div class="sc-card-desc">审察臣工上表，或勾心斗角、或参劾同僚。乾纲独断，定乾坤。</div>
                    </div>
                    <div class="sc-card" data-action="go-page" data-id="harem">
                      <div class="sc-card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M12 7v10"/><path d="M8 12h8"/></svg>
                        驾临后宫
                      </div>
                      <div class="sc-card-desc">巡视后宫，晋位贬黜。亦可夜翻绿头牌，留宿长叙。</div>
                    </div>
                    <div class="sc-card" data-action="go-page" data-id="study">
                      <div class="sc-card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        御书房召见
                      </div>
                      <div class="sc-card-desc">召文臣武将入书房议事，面商决策，密谋不轨或社稷安危。</div>
                    </div>
                    <div class="sc-card" data-action="go-page" data-id="sessions">
                      <div class="sc-card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        执政录 (续约)
                      </div>
                      <div class="sc-card-desc">管理并延续当前正在进行中的留宿夜谈与御前密议。</div>
                    </div>
                    <div class="sc-card" data-action="go-page" data-id="majesty">
                      <div class="sc-card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        圣颜 (帝号配置)
                      </div>
                      <div class="sc-card-desc">拟定国号与年号、改换皇帝自称。昭告天下，万民归心。</div>
                    </div>
                    <div class="sc-card" data-action="go-page" data-id="archives">
                      <div class="sc-card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        皇家卷宗
                      </div>
                      <div class="sc-card-desc">精细订正臣子與妃嫔的命格身家、亲密势力（NPC）、彻底规整关系。</div>
                    </div>
                  </div>
                  <div style="margin-top: 40px; text-align: center;">
                    <button class="sc-btn-secondary" onclick="window.Roche.ui.closeApp()">罢朝归殿 (关闭插件)</button>
                  </div>
                `;
                break;

              case "draft": {
                const haremIds = Object.keys(state.roles).filter(k => state.roles[k].type);
                const candidates = chars.filter(c => !haremIds.includes(c.id));

                let listHTML = "";
                if (candidates.length === 0) {
                  listHTML = `<div style="text-align:center; padding:20px; color:#666;">天下英才仕女皆已在朝。暂无在野人选。</div>`;
                } else {
                  candidates.forEach(c => {
                    listHTML += `
                      <div class="sc-list-item">
                        <div>
                          <strong>${c.handle || c.name}</strong>
                          <span style="font-size:12px; color:#888; margin-left:10px;">${c.bio || "无简介"}</span>
                        </div>
                        <button class="sc-btn" data-action="summon-draft" data-id="${c.id}">召见自荐</button>
                      </div>
                    `;
                  });
                }

                let presentationHTML = "";
                if (state.selectedCharId) {
                  const selChar = chars.find(x => x.id === state.selectedCharId);
                  presentationHTML = `
                    <div style="background:#f5f2e9; padding:20px; border:1px solid #dcd7c9; border-radius:4px; margin-top:20px;">
                      <h4 style="margin:0 0 10px 0; color:#8b2635;">候选人：${selChar?.handle || selChar?.name} 殿上面陈</h4>
                      <p style="font-style:italic; min-height:60px;">"${state.draftSpeech || "宣召上殿，面聆圣听……"}"</p>
                      
                      ${state.draftSpeech && state.draftSpeech !== "召唤中..." ? `
                        <div style="margin-top:15px; display:flex; gap:10px; align-items:center;">
                          <label style="font-size:13px; color:#555;">册受位份：</label>
                          <select id="draft-rank-select" class="sc-select" style="width:120px; padding:4px;">
                            ${haremRanks.map(r => `<option value="${r}">${r}</option>`).join("")}
                          </select>
                          <button class="sc-btn" data-action="appoint-harem">册封，迁入后宫</button>
                        </div>
                      ` : ""}
                    </div>
                  `;
                }

                contentHTML = `
                  <div class="sc-bar">
                    <span class="sc-back" data-action="go-back">⬅ 返回太极殿</span>
                    <strong>大典：秀阁遴选</strong>
                  </div>
                  <p style="font-size:13px; color:#666; margin-bottom:15px;">此处列出了在野的角色。召见他们并封官改位。</p>
                  <div>
                    ${listHTML}
                  </div>
                  ${presentationHTML}
                `;
                break;
              }

              case "exam": {
                const courtIds = Object.keys(state.roles).filter(k => state.roles[k].type);
                const candidates = chars.filter(c => !courtIds.includes(c.id));

                let listHTML = "";
                if (candidates.length === 0) {
                  listHTML = `<p style="color:#666;">系统内角色均已被征辟为官或纳入后宫。暂无应举生员。</p>`;
                } else {
                  candidates.forEach(c => {
                    listHTML += `
                      <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer;">
                        <input type="checkbox" class="exam-candidate-check" value="${c.id}">
                        <span>${c.handle || c.name} <small style="color:#888;">(${c.bio || "无"})</small></span>
                      </label>
                    `;
                  });
                }

                let answersHTML = "";
                if (state.examAnswers.status === "loading") {
                  answersHTML = `<div class="sc-loading">各州府解送试卷中，翰林考官批阅中……</div>`;
                } else if (Object.keys(state.examAnswers).length > 0) {
                  answersHTML = `<h3 style="color:#8b2635; border-bottom:1px solid #dcd7c9; padding-bottom:10px; margin-top:30px;">殿试卷宗阅览</h3>`;
                  Object.entries(state.examAnswers).forEach(([cid, ans]) => {
                    const ch = chars.find(x => x.id === cid);
                    if (!ch) return;
                    answersHTML += `
                      <div style="background:#fcfaf2; border:1px solid #dcd7c9; padding:15px; margin-bottom:15px; border-radius:4px;">
                        <strong>【贡生】${ch.handle || ch.name} 呈送策论：</strong>
                        <p style="margin:10px 0; font-size:13px; white-space: pre-wrap; color:#3a352a; font-family:serif;">“ ${ans} ”</p>
                        <div style="display:flex; gap:12px; align-items:center;">
                          <label style="font-size:12px; color:#555;">拟任官职：</label>
                          <select id="court-rank-select-${cid}" class="sc-select" style="width:140px; padding:4px;">
                            ${courtRanks.map(cr => `<option value="${cr}">${cr}</option>`).join("")}
                          </select>
                          <button class="sc-btn" data-action="appoint-court" data-id="${cid}">钦点授官</button>
                        </div>
                      </div>
                    `;
                  });
                }

                contentHTML = `
                  <div class="sc-bar">
                    <span class="sc-back" data-action="go-back">⬅ 返回太极殿</span>
                    <strong>御前大考 · 金殿殿试</strong>
                  </div>
                  <div style="background:#fcfbfa; padding:15px; border:1px solid #eae5da; border-radius:4px; margin-bottom:20px;">
                    <label style="display:block; font-weight:bold; margin-bottom:8px;">制拟殿试策考题：</label>
                    <textarea id="exam-q-input" class="sc-textarea" rows="2">${state.examQuestion}</textarea>
                  </div>
                  <div style="background:#fcfbfa; padding:15px; border:1px solid #eae5da; border-radius:4px;">
                    <label style="display:block; font-weight:bold; margin-bottom:8px;">圈选参与应试之士子（支持多选）：</label>
                    <div style="max-height: 150px; overflow-y:auto; padding:5px; border:1px solid #eae5da; background:#fff; margin-bottom:10px;">
                      ${listHTML}
                    </div>
                    ${candidates.length > 0 ? `<button class="sc-btn" data-action="start-exam">降旨考试，评卷阅览</button>` : ""}
                  </div>
                  ${answersHTML}
                `;
                break;
              }

              case "generate": {
                let listHTML = "";
                chars.forEach(c => {
                  const r = state.roles[c.id];
                  const hasBg = r && r.background;
                  listHTML += `
                    <div class="sc-list-item">
                      <div>
                        <strong>${c.handle || c.name}</strong> 
                        <span style="font-size:12px; color:#999;">${r ? `[已归属 - ${r.rank || "百姓"}]` : "[在野]"}</span>
                        ${hasBg ? `<span style="font-size:11px; color:#5a8a5a; margin-left:10px;">✓ 已推演身世</span>` : `<span style="font-size:11px; color:#b55; margin-left:10px;">✗ 命理空缺</span>`}
                      </div>
                      <button class="sc-btn" data-action="generate-bg" data-id="${c.id}">
                        ${hasBg ? "逆天重演" : "天命推演"}
                      </button>
                    </div>
                  `;
                });

                contentHTML = `
                  <div class="sc-bar">
                    <span class="sc-back" data-action="go-back">⬅ 返回太极殿</span>
                    <strong>玄黄命数 · 生平演绎</strong>
                  </div>
                  <p style="font-size:13px; color:#666; margin-bottom:15px;">通过大语言模型自动演绎其古代身份、门阀、政治派系，并生成至多5位随从/亲眷关系NPC，用以在之后的密谈留宿交互中提供充足的背景参照。</p>
                  <div>
                    ${listHTML}
                  </div>
                `;
                break;
              }

              case "memorial": {
                let petitionHTML = "";
                if (state.currentPetition) {
                  petitionHTML = `
                    <div style="background:#f5f1e6; border:1px solid #c8bfae; padding:24px; border-radius:4px; margin-top:20px; font-family:serif;">
                      <h4 style="margin:0 0 12px 0; color:#8b2635; border-bottom:1px solid #c8bfae; padding-bottom:8px;">
                        呈：${state.currentPetition.sender}
                      </h4>
                      <p style="font-size:15px; color:#1a1a1a; letter-spacing:1px; white-space:pre-wrap;">“ ${state.currentPetition.content} ”</p>
                      
                      ${state.currentPetition.sender !== "呈送中..." ? `
                        <div style="margin-top:20px; border-top:1px dashed #c8bfae; padding-top:15px; display:flex; gap:10px;">
                          <button class="sc-btn" data-action="handle-petition" data-id="approve">准奏 (朱批御批)</button>
                          <button class="sc-btn-secondary" data-action="handle-petition" data-id="table">留中不发</button>
                          <button class="sc-btn-secondary" style="color:#b33;" data-action="handle-petition" data-id="reject">退回驳回</button>
                        </div>
                      ` : ""}
                    </div>
                  `;
                }

                let resultHTML = "";
                if (state.petitionResult) {
                  resultHTML = `
                    <div style="background:#ebf3eb; border:1px solid #c2dec2; padding:16px; border-radius:4px; margin-top:20px;">
                      <h4 style="margin:0 0 8px 0; color:#3a6a3a;">圣意传宣反馈：</h4>
                      <p style="font-size:13px; color:#2c4c2c; font-style:italic;">${state.petitionResult}</p>
                    </div>
                  `;
                }

                contentHTML = `
                  <div class="sc-bar">
                    <span class="sc-back" data-action="go-back">⬅ 返回太极殿</span>
                    <strong>通政司 · 批阅奏章</strong>
                  </div>
                  <p style="font-size:13px; color:#666; margin-bottom:15px;">各部司、地方道府、以及后宫妃嫔外戚，皆有奏折秘密折子上报。君王的审判直接改写其势力格局。</p>
                  <button class="sc-btn" data-action="fetch-petition">宣召折子御批</button>
                  ${petitionHTML}
                  ${resultHTML}
                `;
                break;
              }

              case "harem": {
                const haremList = Object.entries(state.roles)
                  .filter(([_, r]) => r.type === "harem")
                  .map(([cid, r]) => ({ cid, ...r }));

                let listHTML = "";
                if (haremList.length === 0) {
                  listHTML = `<div style="text-align:center; padding:30px; color:#666;">后宫无妃嫔，请往【选秀大典】遴选。</div>`;
                } else {
                  haremList.forEach(item => {
                    const char = chars.find(c => c.id === item.cid);
                    if (!char) return;
                    listHTML += `
                      <div class="sc-list-item">
                        <div>
                          <strong>${char.handle || char.name}</strong>
                          <span style="font-size:11px; background:#e8dadb; color:#701c27; padding:1px 6px; margin-left:10px;">当前：${item.rank}</span>
                          <div style="font-size:12px; color:#666; margin-top:4px;">${item.background ? item.background.substring(0,60) + "..." : "暂未推演身世"}</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                          <select id="rank-select-harem-${item.cid}" class="sc-select" style="width:90px; padding:2px;">
                            ${haremRanks.map(hr => `<option value="${hr}" ${item.rank === hr ? "selected" : ""}>${hr}</option>`).join("")}
                          </select>
                          <button class="sc-btn-secondary" style="padding:4px 8px;" data-action="harem-rank-change" data-id="${item.cid}">改封</button>
                          <button class="sc-btn" style="padding:4px 10px;" data-action="launch-stay" data-id="${item.cid}">留宿</button>
                          <button class="sc-btn-secondary" style="color:#b55; padding:4px 8px;" data-action="dismiss-role" data-id="${item.cid}">罢黜</button>
                        </div>
                      </div>
                    `;
                  });
                }

                contentHTML = `
                  <div class="sc-bar">
                    <span class="sc-back" data-action="go-back">⬅ 返回太极殿</span>
                    <strong>掖庭深宫 · 后宫寝苑</strong>
                  </div>
                  <p style="font-size:13px; color:#666; margin-bottom:15px;">此殿为已册封之佳丽仙眷之所。您可以晋爵贬黜、或摆驾留宿进行长夜长叙互动。</p>
                  <div>
                    ${listHTML}
                  </div>
                `;
                break;
              }

              case "study": {
                const courtList = Object.entries(state.roles)
                  .filter(([_, r]) => r.type === "court")
                  .map(([cid, r]) => ({ cid, ...r }));

                let listHTML = "";
                if (courtList.length === 0) {
                  listHTML = `<div style="text-align:center; padding:30px; color:#666;">暖阁清冷。请于【御前科考】擢拔臣工。</div>`;
                } else {
                  courtList.forEach(item => {
                    const char = chars.find(c => c.id === item.cid);
                    if (!char) return;
                    listHTML += `
                      <div class="sc-list-item">
                        <div>
                          <strong>${char.handle || char.name}</strong>
                          <span style="font-size:11px; background:#dae3e8; color:#1c4d70; padding:1px 6px; margin-left:10px;">授任：${item.rank}</span>
                          <div style="font-size:12px; color:#666; margin-top:4px;">${item.background ? item.background.substring(0,60) + "..." : "未推演功名"}</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                          <select id="rank-select-court-${item.cid}" class="sc-select" style="width:110px; padding:2px;">
                            ${courtRanks.map(cr => `<option value="${cr}" ${item.rank === cr ? "selected" : ""}>${cr}</option>`).join("")}
                          </select>
                          <button class="sc-btn-secondary" style="padding:4px 8px;" data-action="court-rank-change" data-id="${item.cid}">简简/升迁</button>
                          <button class="sc-btn" style="padding:4px 10px; background:#1c5a70; border-color:#144456;" data-action="launch-talk" data-id="${item.cid}">密谈</button>
                          <button class="sc-btn-secondary" style="color:#b55; padding:4px 8px;" data-action="dismiss-role" data-id="${item.cid}">革职</button>
                        </div>
                      </div>
                    `;
                  });
                }

                contentHTML = `
                  <div class="sc-bar">
                    <span class="sc-back" data-action="go-back">⬅ 返回太极殿</span>
                    <strong>御书房 · 枢密暖阁</strong>
                  </div>
                  <p style="font-size:13px; color:#666; margin-bottom:15px;">此处为朝臣召见之处。可随时晋迁、贬谪，或摒退左右进行国家大事之君臣商讨。</p>
                  <div>
                    ${listHTML}
                  </div>
                `;
                break;
              }

              case "chat": {
                const session = state.sessions.find(s => s.id === state.activeSessionId);
                if (!session) {
                  contentHTML = `<p>未找到当前会话记录。请返回重新召见。</p>`;
                  break;
                }
                const char = chars.find(c => c.id === session.charId);
                const r = state.roles[session.charId] || { rank: "在野", background: "", npcs: [] };

                let msgsHTML = "";
                session.messages.forEach(m => {
                  let cls = "sys";
                  if (m.role === "user") cls = "user";
                  else if (m.role === "assistant") cls = "assistant";
                  msgsHTML += `<div class="sc-msg ${cls}">${m.text}</div>`;
                });

                let npcsHTML = "";
                if (r.npcs && r.npcs.length > 0) {
                  r.npcs.forEach(n => {
                    npcsHTML += `
                      <div style="background:#f4f0e6; padding:8px; border-radius:3px; margin-bottom:6px; font-size:12px;">
                        <strong>${n.name}</strong> (${n.relation})
                        <div style="color:#666; margin-top:2px;">${n.description}</div>
                      </div>
                    `;
                  });
                } else {
                  npcsHTML = `<span style="font-size:12px; color:#888;">暂无连带部属、亲眷记录。</span>`;
                }

                contentHTML = `
                  <div class="sc-bar">
                    <span class="sc-back" data-action="go-page" data-id="sessions">⬅ 返回执政录</span>
                    <strong>【与 ${char?.handle || char?.name}】对榻夜谈</strong>
                  </div>
                  <div class="sc-layout-split">
                    <div style="border-right:1px solid #dcd7c9; padding-right:16px;">
                      <h4 style="color:#8b2635; margin:0 0 10px 0;">起居注案卷</h4>
                      <p style="font-size:13px; margin-bottom:15px;">
                        <strong>尊姓：</strong>${char?.name}<br>
                        <strong>王朝封赐：</strong>${r.rank}<br>
                      </p>
                      <h5 style="margin:10px 0 5px 0;">家世渊源背景：</h5>
                      <div style="font-size:12px; max-height:120px; overflow-y:auto; background:#fbfaf7; padding:8px; border:1px solid #eae5da; line-height:1.4; margin-bottom:15px; color:#444;">
                        ${r.background || "平民出身。未行推演。"}
                      </div>
                      <h5 style="margin:10px 0 5px 0;">羁绊NPC关系人：</h5>
                      <div style="max-height:180px; overflow-y:auto;">
                        ${npcsHTML}
                      </div>
                    </div>
                    <div>
                      <div class="sc-chat-area">
                        <div class="sc-chat-history" id="sc-chat-container">
                          ${msgsHTML}
                        </div>
                        <div class="sc-chat-input-bar">
                          <input type="text" id="sc-chat-input" class="sc-input" placeholder="输入陛下圣旨密语..." onkeydown="if(event.key==='Enter') { document.querySelector('[data-action=\\'send-chat\\']').click(); }">
                          <button class="sc-btn" data-action="send-chat">传旨</button>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
                // 延时让聊天区域滚动到底部
                setTimeout(() => {
                  const scrollBox = rootEl.querySelector("#sc-chat-container");
                  if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;
                }, 50);
                break;
              }

              case "sessions": {
                let sHTML = "";
                if (state.sessions.length === 0) {
                  sHTML = `<p style="color:#666; text-align:center; padding:30px;">尚无已经开启的秘密夜谈或召见对话。</p>`;
                } else {
                  state.sessions.forEach(s => {
                    const ch = chars.find(x => x.id === s.charId);
                    const r = state.roles[s.charId] || { rank: "在野" };
                    if (!ch) return;
                    sHTML += `
                      <div class="sc-list-item">
                        <div>
                          <strong>${s.type === "stay" ? "【留宿中】" : "【密议中】"} ${ch.handle || ch.name}</strong>
                          <span style="font-size:11px; color:#555; background:#eae4d8; padding:1px 6px; margin-left:10px;">${r.rank}</span>
                          <div style="font-size:12px; color:#888; margin-top:4px;">会话内已有 ${s.messages.length - 1} 轮对答。</div>
                        </div>
                        <div style="display:flex; gap:10px;">
                          <button class="sc-btn" data-action="go-page" data-id="chat" onclick="window.shangchao_activeSessionId='${s.id}'" data-sess-injector="${s.id}">驾临</button>
                          <button class="sc-btn-secondary" style="color:#b55;" data-action="delete-session" data-id="${s.id}">撤驾 (结束)</button>
                        </div>
                      </div>
                    `;
                  });
                }

                contentHTML = `
                  <div class="sc-bar">
                    <span class="sc-back" data-action="go-back">⬅ 返回太极殿</span>
                    <strong>执政会商档案（续约记录）</strong>
                  </div>
                  <p style="font-size:13px; color:#666; margin-bottom:15px;">此处保留着陛下已经启动的留宿与密议，支持跨生命期延续对话或执行彻底删除解脱。</p>
                  <div>
                    ${sHTML}
                  </div>
                `;
                // 使用极其安全的临时全局通道，将点选的值安全回传 state
                setTimeout(() => {
                  rootEl.querySelectorAll("[data-sess-injector]").forEach(btn => {
                    btn.addEventListener("click", () => {
                      state.activeSessionId = btn.getAttribute("data-sess-injector");
                    });
                  });
                }, 50);
                break;
              }

              case "majesty": {
                contentHTML = `
                  <div class="sc-bar">
                    <span class="sc-back" data-action="go-back">⬅ 返回太极殿</span>
                    <strong>天子御容 · 王朝名号</strong>
                  </div>
                  <div style="max-width:500px; margin: 0 auto; display:flex; flex-direction:column; gap:15px;">
                    <div>
                      <label style="display:block; font-weight:bold; margin-bottom:5px;">王朝国号：</label>
                      <input type="text" id="dynasty-state" class="sc-input" value="${state.dynasty.stateName}">
                    </div>
                    <div>
                      <label style="display:block; font-weight:bold; margin-bottom:5px;">当前年号：</label>
                      <input type="text" id="dynasty-era" class="sc-input" value="${state.dynasty.eraName}">
                    </div>
                    <div>
                      <label style="display:block; font-weight:bold; margin-bottom:5px;">君王自称 (天子面具)：</label>
                      <input type="text" id="dynasty-title" class="sc-input" value="${state.dynasty.userTitle}" placeholder="如：朕、寡人、孤、本圣上">
                    </div>
                    <button class="sc-btn" data-action="save-majesty">布告天下，修订改元</button>
                  </div>
                `;
                break;
              }

              case "archives": {
                let listHTML = "";
                chars.forEach(c => {
                  const r = state.roles[c.id] || { type: null, rank: "无官位", background: "", npcs: [] };

                  let npcsListHTML = "";
                  (r.npcs || []).forEach((n, idx) => {
                    npcsListHTML += `
                      <div class="npc-row-${c.id}-${idx}" style="display:flex; gap:5px; margin-bottom:6px; align-items:center;">
                        <input type="text" class="sc-input npc-name" style="width:70px; padding:2px;" value="${n.name}" placeholder="姓名">
                        <input type="text" class="sc-input npc-rel" style="width:70px; padding:2px;" value="${n.relation}" placeholder="关系">
                        <input type="text" class="sc-input npc-desc" style="width:180px; padding:2px;" value="${n.description}" placeholder="生平描述">
                        <button class="sc-btn" style="padding:2px 6px;" data-action="save-npc" data-id="${c.id}::${idx}">存</button>
                        <button class="sc-btn-secondary" style="padding:2px 6px; color:#b55;" data-action="delete-npc" data-id="${c.id}::${idx}">删</button>
                      </div>
                    `;
                  });

                  listHTML += `
                    <div class="sc-char-row">
                      <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <strong>${c.handle || c.name} <small style="color:#888;">(${r.type === "harem" ? "后宫" : r.type === "court" ? "朝廷" : "未册封"} · ${r.rank})</small></strong>
                      </div>
                      <div style="margin-bottom:10px;">
                        <label style="font-size:12px; color:#555; display:block;">生平密册背景：</label>
                        <textarea id="archive-bg-${c.id}" class="sc-textarea" rows="2" style="font-size:12px;">${r.background || ""}</textarea>
                        <button class="sc-btn-secondary" style="padding:2px 8px; font-size:11px; margin-top:5px;" data-action="save-archive" data-id="${c.id}">保存背景</button>
                      </div>
                      <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                          <label style="font-size:12px; color:#555;">亲随NPC羁绊网 (限5位)：</label>
                          <button class="sc-btn" style="padding:2px 6px; font-size:11px;" data-action="add-npc" data-id="${c.id}">+ 添加随从</button>
                        </div>
                        ${npcsListHTML}
                      </div>
                    </div>
                  `;
                });

                contentHTML = `
                  <div class="sc-bar">
                    <span class="sc-back" data-action="go-back">⬅ 返回太极殿</span>
                    <strong>内阁中书省 · 密奏卷宗修定</strong>
                  </div>
                  <p style="font-size:13px; color:#666; margin-bottom:15px;">此处可直接编辑任何角色的生平背景信息以及NPC关系图谱，规避AI生成偏误，以实现精确背景控制。</p>
                  <div style="max-height:600px; overflow-y:auto; padding-right:8px;">
                    ${listHTML}
                  </div>
                `;
                break;
              }
            }

            rootEl.innerHTML = `
              <div class="sc-container">
                ${contentHTML}
              </div>
            `;
          }

          // 7. 首次初始渲染
          await render();
        },

        async unmount(container, roche) {
          // 移除全局监听器
          uiListeners.forEach(({ el, type, handler }) => {
            if (el) el.removeEventListener(type, handler);
          });
          uiListeners = [];

          // 移除样式表
          const styleEl = container.querySelector("#shangchao-plugin-css");
          if (styleEl) styleEl.remove();

          // 彻底还原 DOM
          container.replaceChildren();
          currentContainer = null;
        }
      }
    ]
  });
})();