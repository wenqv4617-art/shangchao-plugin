(function () {
  // 辅助函数：HTML转义
  const esc = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // 辅助函数：生成唯一ID
  const uuid = () => {
    return 'sc_' + Math.random().toString(36).substring(2, 15);
  };

  // 极简 SVG 矢量图标库 (无表情符号)
  const ICONS = {
    home: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    sessions: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    archives: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    back: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
    edit: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>`,
    add: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    delete: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    view: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    close: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    up: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`,
    down: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    chat: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`
  };

  const STYLE_ID = 'roche-plugin-shangchao-style';

  // 现代浅蓝、空气感、高净度 Slate + Sky Blue 界面系统
  const STYLES = `
    .roche-plugin-shangchao {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background-color: #f8fafc;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-sizing: border-box;
      position: relative;
    }
    .roche-plugin-shangchao * {
      box-sizing: border-box;
    }
    .sc-header {
      height: 56px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      background-color: #ffffff;
    }
    .sc-header-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
    /* 极致简化无边框返回/关闭按钮 */
    .sc-header-btn-plain {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748b;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }
    .sc-header-btn-plain:hover {
      color: #0ea5e9;
    }
    .sc-header-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: 1px solid #e2e8f0;
      padding: 6px 12px;
      cursor: pointer;
      color: #475569;
      font-size: 13px;
      border-radius: 6px;
      background-color: #ffffff;
      transition: all 0.2s;
    }
    .sc-header-btn:hover {
      background-color: #f1f5f9;
      border-color: #cbd5e1;
    }
    .sc-viewport {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .roche-plugin-shangchao.has-dock .sc-viewport {
      padding-bottom: 80px;
    }
    .sc-dock {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background-color: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: none;
      justify-content: space-around;
      align-items: center;
      z-index: 10;
    }
    .roche-plugin-shangchao.has-dock .sc-dock {
      display: flex;
    }
    .sc-dock-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      color: #64748b;
      font-size: 12px;
      cursor: pointer;
      flex: 1;
      height: 100%;
      gap: 4px;
      transition: all 0.2s;
    }
    .sc-dock-item:hover {
      background-color: #f8fafc;
      color: #0f172a;
    }
    .sc-dock-item.active {
      color: #0ea5e9;
      font-weight: 600;
    }
    .sc-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .sc-card-title {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sc-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .sc-btn {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      color: #334155;
      padding: 10px;
      border-radius: 6px;
      cursor: pointer;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.15s ease-in-out;
    }
    .sc-btn:hover {
      background-color: #f8fafc;
      border-color: #cbd5e1;
    }
    /* SVG专属小动作按钮，无繁冗文字 */
    .sc-btn-icon {
      padding: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      line-height: 1;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .sc-btn-icon:hover {
      background-color: #f1f5f9;
      color: #0ea5e9;
      border-color: #cbd5e1;
    }
    .sc-btn-primary {
      background-color: #0ea5e9;
      border-color: #0ea5e9;
      color: #ffffff;
    }
    .sc-btn-primary:hover {
      background-color: #0284c7;
      border-color: #0284c7;
    }
    .sc-input, .sc-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      background-color: #ffffff;
      border-radius: 6px;
      color: #0f172a;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .sc-input:focus, .sc-select:focus {
      outline: none;
      border-color: #0ea5e9;
    }
    .sc-badge {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 12px;
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 500;
    }
    .sc-badge-concubine {
      background-color: #ffe4e6;
      color: #9f1239;
    }
    .sc-badge-official {
      background-color: #e0f2fe;
      color: #0369a1;
    }
    .sc-list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .sc-list-item:last-child {
      border-bottom: none;
    }
    /* 卷宗 details 折叠与详情行 */
    .sc-archive-details {
      margin-top: 8px;
      border: 1px solid #f1f5f9;
      border-radius: 6px;
      background-color: #f8fafc;
      overflow: hidden;
    }
    .sc-archive-details summary {
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 500;
      color: #0ea5e9;
      cursor: pointer;
      user-select: none;
      outline: none;
    }
    .sc-archive-details summary:hover {
      background-color: #f1f5f9;
    }
    .sc-archive-content {
      padding: 12px;
      font-size: 13px;
      color: #475569;
      border-top: 1px solid #f1f5f9;
      line-height: 1.6;
    }
    /* NPC管理独立列表行 */
    .sc-npc-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 6px;
    }
    .sc-npc-info {
      font-size: 13px;
      color: #334155;
    }
    .sc-npc-actions {
      display: flex;
      gap: 6px;
    }
    /* 对话布局样式 */
    .sc-chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .sc-chat-history {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .sc-chat-msg {
      margin-bottom: 16px;
      line-height: 1.6;
      font-size: 14px;
    }
    .sc-chat-msg.narrative {
      color: #475569;
      border-left: 3px solid #cbd5e1;
      padding-left: 12px;
    }
    .sc-chat-msg.user {
      text-align: right;
    }
    .sc-chat-msg.user .msg-content {
      display: inline-block;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 10px 14px;
      border-radius: 8px;
      text-align: left;
      max-width: 80%;
    }
    .sc-chat-msg-sender {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 4px;
      font-weight: 500;
    }
    .sc-chat-input-area {
      display: flex;
      gap: 8px;
    }
    .sc-chat-input {
      flex: 1;
      padding: 12px;
      border: 1px solid #e2e8f0;
      background-color: #ffffff;
      border-radius: 6px;
      font-size: 14px;
      color: #0f172a;
    }
    .sc-chat-input:focus {
      outline: none;
      border-color: #0ea5e9;
    }
    .sc-memorial-scroll {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 16px;
      font-size: 14px;
      line-height: 1.7;
      color: #334155;
    }
    .sc-dynasty-badge {
      display: inline-block;
      background-color: #e0f2fe;
      color: #0369a1;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      margin-left: 8px;
    }
  `;

  const DEFAULT_DYNASTY = {
    eraName: '大燕',
    year: '元'
  };

  window.RochePlugin.register({
    id: 'shangchao-plugin',
    name: '上朝！',
    version: '1.2.0',
    apps: [
      {
        id: 'shangchao-home',
        name: '上朝！',
        icon: 'extension',
        iconImage: '',

        async mount(container, roche) {
          // 挂载现代样式表
          if (!document.getElementById(STYLE_ID)) {
            const style = document.createElement('style');
            style.id = STYLE_ID;
            style.innerHTML = STYLES;
            document.head.appendChild(style);
          }

          // 初始化主页面
          container.innerHTML = `
            <div class="roche-plugin-shangchao has-dock">
              <div class="sc-header"></div>
              <div class="sc-viewport" id="sc-main-view"></div>
              <div class="sc-dock">
                <button class="sc-dock-item active" id="sc-dock-home" data-tab="home">
                  ${ICONS.home} <span>首页</span>
                </button>
                <button class="sc-dock-item" id="sc-dock-sessions" data-tab="sessions">
                  ${ICONS.sessions} <span>续约</span>
                </button>
                <button class="sc-dock-item" id="sc-dock-archives" data-tab="archives">
                  ${ICONS.archives} <span>卷宗</span>
                </button>
              </div>
            </div>
          `;

          const mainWrapper = container.querySelector('.roche-plugin-shangchao');
          const viewContainer = container.querySelector('#sc-main-view');
          const headerContainer = container.querySelector('.sc-header');

          let currentTab = 'home';
          let currentSubView = null; // 'draft', 'exam', 'background', 'memorials', 'harem', 'study', 'emperor', 'chat'
          let activeChatSessionId = null;
          let isAiThinking = false; // AI回复等待状态标记

          let listCharacters = [];
          let dynInfo = DEFAULT_DYNASTY;
          let gameData = {
            roles: {}, // charId -> { type, title, rank, background, npcs: [] }
            sessions: [], // { id, type, charId, messages: [] }
            memorials: []
          };

          const saveGameData = async () => {
            await roche.storage.set('game_data', gameData);
          };

          const loadAllData = async () => {
            try {
              listCharacters = await roche.character.list();
            } catch (e) {
              listCharacters = [];
            }
            try {
              const storedDyn = await roche.storage.get('dynasty_info');
              if (storedDyn) dynInfo = storedDyn;

              const storedData = await roche.storage.get('game_data');
              if (storedData) gameData = { ...gameData, ...storedData };
            } catch (e) {
              console.error('[上朝！] 数据加载异常', e);
            }
          };

          const render = () => {
            renderHeader();

            if (currentSubView) {
              mainWrapper.classList.remove('has-dock');
              renderSubView();
            } else {
              mainWrapper.classList.add('has-dock');
              renderTab();
            }
          };

          // 渲染顶部：二级子页面支持极简无框 SVG 退回，召见页支持动态加载文本
          const renderHeader = () => {
            if (currentSubView === 'chat') {
              const session = gameData.sessions.find(s => s.id === activeChatSessionId);
              const char = session ? listCharacters.find(c => c.id === session.charId) : null;
              
              // 请求回复时，顶部标题动态切换为“输入中……”
              const headerTitleText = isAiThinking ? '输入中……' : (char ? char.name : '召见');

              headerContainer.innerHTML = `
                <button class="sc-header-btn-plain" id="sc-header-back-btn" title="返回">
                  ${ICONS.back}
                </button>
                <div class="sc-header-title">${esc(headerTitleText)}</div>
                <div style="width:32px;"></div> 
              `;
              headerContainer.querySelector('#sc-header-back-btn').onclick = () => {
                currentSubView = null;
                activeChatSessionId = null;
                render();
              };
            } else if (currentSubView) {
              headerContainer.innerHTML = `
                <button class="sc-header-btn-plain" id="sc-header-back-btn" title="返回">
                  ${ICONS.back}
                </button>
                <div class="sc-header-title">【${esc(dynInfo.eraName)}】${esc(dynInfo.year)}年</div>
                <div style="width:32px;"></div> 
              `;
              headerContainer.querySelector('#sc-header-back-btn').onclick = () => {
                currentSubView = null;
                render();
              };
            } else {
              // 主页签：右上角极简 SVG 关闭
              headerContainer.innerHTML = `
                <div class="sc-header-title">
                  上朝！
                  <span class="sc-dynasty-badge">【${esc(dynInfo.eraName)}】${esc(dynInfo.year)}年</span>
                </div>
                <button class="sc-header-btn-plain" id="sc-header-close-btn" title="退出">
                  ${ICONS.close}
                </button>
              `;
              headerContainer.querySelector('#sc-header-close-btn').onclick = () => {
                roche.ui.closeApp();
              };
            }
          };

          const switchTab = (tabName) => {
            currentTab = tabName;
            currentSubView = null;
            container.querySelectorAll('.sc-dock-item').forEach(btn => {
              if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
              } else {
                btn.classList.remove('active');
              }
            });
            render();
          };

          const renderTab = () => {
            if (currentTab === 'home') {
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">
                    <span>朝堂事务</span>
                    <button class="sc-header-btn" style="padding: 4px 8px; font-size:11px;" id="sc-btn-edit-emperor">${ICONS.edit} 修改年号</button>
                  </div>
                  <div class="sc-grid">
                    <button class="sc-btn" id="sc-nav-draft">选秀大典</button>
                    <button class="sc-btn" id="sc-nav-exam">科考殿试</button>
                    <button class="sc-btn" id="sc-nav-background">身边人生成</button>
                    <button class="sc-btn sc-btn-primary" id="sc-nav-memorials">
                      批阅奏折 (${gameData.memorials ? gameData.memorials.length : 0})
                    </button>
                  </div>
                </div>

                <div class="sc-card">
                  <div class="sc-card-title">巡视召见</div>
                  <div class="sc-grid">
                    <button class="sc-btn" id="sc-nav-harem" style="border-color: #38bdf8; color:#0284c7; background-color:#f0f9ff;">后宫召见</button>
                    <button class="sc-btn" id="sc-nav-study" style="border-color: #38bdf8; color:#0284c7; background-color:#f0f9ff;">御书房召见</button>
                  </div>
                </div>
              `;

              container.querySelector('#sc-btn-edit-emperor').onclick = () => { currentSubView = 'emperor'; render(); };
              container.querySelector('#sc-nav-draft').onclick = () => { currentSubView = 'draft'; render(); };
              container.querySelector('#sc-nav-exam').onclick = () => { currentSubView = 'exam'; render(); };
              container.querySelector('#sc-nav-background').onclick = () => { currentSubView = 'background'; render(); };
              container.querySelector('#sc-nav-memorials').onclick = () => { currentSubView = 'memorials'; render(); };
              container.querySelector('#sc-nav-harem').onclick = () => { currentSubView = 'harem'; render(); };
              container.querySelector('#sc-nav-study').onclick = () => { currentSubView = 'study'; render(); };

            } else if (currentTab === 'sessions') {
              const sList = gameData.sessions || [];
              if (sList.length === 0) {
                viewContainer.innerHTML = `
                  <div style="text-align:center; padding: 40px 10px; color:#64748b; font-size:14px;">
                    暂无进行中的召见。
                  </div>
                `;
                return;
              }

              let html = `<div class="sc-card"><div class="sc-card-title">进行中的召见</div>`;
              sList.forEach((s) => {
                const char = listCharacters.find(c => c.id === s.charId);
                const name = char ? char.name : '未知角色';
                const role = gameData.roles[s.charId] || {};
                const titleText = role.title ? `【${role.title}】` : '';
                const typeText = s.type === 'overnight' ? '后宫留宿' : '御书房密谈';

                html += `
                  <div class="sc-list-item">
                    <div>
                      <div style="font-weight:600; color:#0f172a;">${esc(name)} ${esc(titleText)}</div>
                      <div style="font-size:12px; color:#64748b; margin-top:2px;">${esc(typeText)}</div>
                    </div>
                    <div style="display:flex; gap:8px;">
                      <button class="sc-btn" style="padding:4px 8px; font-size:12px;" id="sc-btn-resume-${s.id}">继续</button>
                      <button class="sc-btn" style="padding:4px 8px; font-size:12px; border-color:#ef4444; color:#ef4444;" id="sc-btn-del-sess-${s.id}">删除</button>
                    </div>
                  </div>
                `;
              });
              html += '</div>';
              viewContainer.innerHTML = html;

              sList.forEach((s) => {
                container.querySelector(`#sc-btn-resume-${s.id}`).onclick = () => {
                  activeChatSessionId = s.id;
                  currentSubView = 'chat';
                  render();
                };
                container.querySelector(`#sc-btn-del-sess-${s.id}`).onclick = async () => {
                  const confirm = await roche.ui.confirm({
                    title: '删除会话',
                    message: '确定要结束这段对话记录吗？'
                  });
                  if (confirm) {
                    gameData.sessions = gameData.sessions.filter(sess => sess.id !== s.id);
                    await saveGameData();
                    renderTab();
                  }
                };
              });

            } else if (currentTab === 'archives') {
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">大燕实录卷宗</div>
                  <div id="sc-archives-list"></div>
                </div>
              `;
              const listDiv = container.querySelector('#sc-archives-list');
              if (listCharacters.length === 0) {
                listDiv.innerHTML = `<div style="text-align:center; padding:20px 0; color:#64748b;">未找到可导入的角色。</div>`;
                return;
              }

              let html = '';
              listCharacters.forEach(c => {
                const role = gameData.roles[c.id] || { type: 'none', title: '平民', rank: '', background: '', npcs: [] };
                const bg = role.background || '暂无详细家世设定';
                const npcs = role.npcs || [];

                let badgeClass = '';
                let badgeText = '平民';
                if (role.type === 'concubine') {
                  badgeClass = 'sc-badge-concubine';
                  badgeText = '妃嫔';
                } else if (role.type === 'official') {
                  badgeClass = 'sc-badge-official';
                  badgeText = '朝臣';
                }

                // 卷宗折叠：亲属模块设计为独立栏并支持精细化 CRUD [2, 4]
                html += `
                  <div style="padding:14px 0; border-bottom:1px solid #f1f5f9;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-weight:600; font-size:15px; color:#0f172a;">${esc(c.name)}</span>
                      <span class="sc-badge ${badgeClass}">${esc(badgeText)} - ${esc(role.title || '无')} ${esc(role.rank ? role.rank + '品' : '')}</span>
                    </div>
                    
                    <details class="sc-archive-details">
                      <summary>展开查看详细背景</summary>
                      <div class="sc-archive-content">
                        <div style="margin-bottom:12px;">
                          <strong>家世背景：</strong>
                          <div style="margin-top:4px; padding:8px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:6px; min-height:40px;">
                            ${esc(bg)}
                          </div>
                        </div>
                        <div>
                          <strong>亲属戚党 (${npcs.length}/5)：</strong>
                          <div id="sc-npc-list-container-${c.id}" style="margin-top:6px;">
                            ${npcs.length === 0 ? '<div style="font-size:12px; color:#94a3b8; padding:8px 0;">暂无记录</div>' : npcs.map((n, idx) => `
                              <div class="sc-npc-row">
                                <span class="sc-npc-info"><strong>${esc(n.name)}</strong> (${esc(n.relation)})</span>
                                <div class="sc-npc-actions">
                                  <button class="sc-btn-icon" id="sc-btn-npc-view-${c.id}-${idx}" title="查看">${ICONS.view}</button>
                                  <button class="sc-btn-icon" style="color:#ef4444;" id="sc-btn-npc-del-${c.id}-${idx}" title="删除">${ICONS.delete}</button>
                                </div>
                              </div>
                            `).join('')}
                          </div>
                          <div style="margin-top:8px; text-align:right;">
                            <button class="sc-btn-icon sc-btn-primary" id="sc-btn-npc-add-${c.id}" title="新增亲属">${ICONS.add}</button>
                          </div>
                        </div>
                      </div>
                    </details>

                    <div style="margin-top:10px; text-align:right;">
                      <button class="sc-btn-icon" id="sc-btn-edit-arch-${c.id}" title="修改定位及位份">${ICONS.edit}</button>
                    </div>
                  </div>
                `;
              });
              listDiv.innerHTML = html;

              // 注册事件
              listCharacters.forEach(c => {
                const role = gameData.roles[c.id] || { npcs: [] };

                container.querySelector(`#sc-btn-edit-arch-${c.id}`).onclick = () => {
                  openEditArchiveModal(c.id);
                };

                // NPC 查看、删除及新增事件绑定
                (role.npcs || []).forEach((n, idx) => {
                  container.querySelector(`#sc-btn-npc-view-${c.id}-${idx}`).onclick = () => {
                    showNpcBioModal(n);
                  };
                  container.querySelector(`#sc-btn-npc-del-${c.id}-${idx}`).onclick = () => {
                    deleteNpc(c.id, idx);
                  };
                });

                container.querySelector(`#sc-btn-npc-add-${c.id}`).onclick = () => {
                  showAddNpcModal(c.id);
                };
              });
            }
          };

          // 弹出展示 NPC 详细背景
          const showNpcBioModal = (npc) => {
            const mask = document.createElement('div');
            mask.style.cssText = `
              position: absolute; top:0; left:0; right:0; bottom:0;
              background-color: rgba(15, 23, 42, 0.4);
              display: flex; align-items: center; justify-content: center;
              z-index: 1000; padding: 20px;
            `;
            mask.innerHTML = `
              <div class="sc-card" style="width:100%; max-width: 320px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                <div class="sc-card-title">${esc(npc.name)} <span class="sc-badge">${esc(npc.relation)}</span></div>
                <div style="font-size:13px; color:#475569; line-height:1.6; margin-bottom:16px;">${esc(npc.bio || '无详细记录')}</div>
                <button class="sc-btn sc-btn-primary" style="width:100%;" id="sc-modal-close-view">知悉</button>
              </div>
            `;
            container.querySelector('.roche-plugin-shangchao').appendChild(mask);
            mask.querySelector('#sc-modal-close-view').onclick = () => mask.remove();
          };

          // 弹窗式创建 NPC 戚党 [2]
          const showAddNpcModal = (charId) => {
            const role = gameData.roles[charId] || { npcs: [] };
            if ((role.npcs || []).length >= 5) {
              roche.ui.toast('一个角色最多拥有五个身边人');
              return;
            }

            const mask = document.createElement('div');
            mask.style.cssText = `
              position: absolute; top:0; left:0; right:0; bottom:0;
              background-color: rgba(15, 23, 42, 0.4);
              display: flex; align-items: center; justify-content: center;
              z-index: 1000; padding: 20px;
            `;
            mask.innerHTML = `
              <div class="sc-card" style="width:100%; max-width: 320px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                <div class="sc-card-title">新增戚族亲眷</div>
                <label style="font-size:11px; color:#64748b;">姓名</label>
                <input class="sc-input" type="text" id="sc-npc-new-name" placeholder="如：沈老太爷">
                <label style="font-size:11px; color:#64748b;">关系</label>
                <input class="sc-input" type="text" id="sc-npc-new-relation" placeholder="如：祖父">
                <label style="font-size:11px; color:#64748b;">背景生平</label>
                <textarea class="sc-input" style="height:60px; resize:none;" id="sc-npc-new-bio" placeholder="曾任吏部侍郎，在乡间颇有德望。"></textarea>
                <div style="display:flex; gap:8px;">
                  <button class="sc-btn" style="flex:1;" id="sc-modal-npc-cancel">取消</button>
                  <button class="sc-btn sc-btn-primary" style="flex:1;" id="sc-modal-npc-save">录入</button>
                </div>
              </div>
            `;
            container.querySelector('.roche-plugin-shangchao').appendChild(mask);
            
            mask.querySelector('#sc-modal-npc-cancel').onclick = () => mask.remove();
            mask.querySelector('#sc-modal-npc-save').onclick = async () => {
              const name = mask.querySelector('#sc-npc-new-name').value.trim();
              const relation = mask.querySelector('#sc-npc-new-relation').value.trim();
              const bio = mask.querySelector('#sc-npc-new-bio').value.trim();
              if (!name || !relation) {
                roche.ui.toast('请输入姓名与关系');
                return;
              }
              
              if (!gameData.roles[charId]) {
                gameData.roles[charId] = { type: 'none', title: '', rank: '', background: '', npcs: [] };
              }
              if (!gameData.roles[charId].npcs) gameData.roles[charId].npcs = [];
              gameData.roles[charId].npcs.push({ name, relation, bio });
              await saveGameData();
              mask.remove();
              roche.ui.toast('戚党亲眷录入成功');
              render();
            };
          };

          // 删除专属 NPC
          const deleteNpc = async (charId, npcIdx) => {
            const confirm = await roche.ui.confirm({
              title: '删除亲眷',
              message: '确定要裁撤移除此亲族背景吗？'
            });
            if (confirm) {
              gameData.roles[charId].npcs.splice(npcIdx, 1);
              await saveGameData();
              roche.ui.toast('已将其自档案中除去');
              render();
            }
          };

          const openEditArchiveModal = (charId) => {
            const char = listCharacters.find(c => c.id === charId);
            const role = gameData.roles[charId] || { type: 'none', title: '', rank: '', background: '', npcs: [] };

            viewContainer.innerHTML = `
              <div class="sc-card">
                <div class="sc-card-title">修改档案：${esc(char.name)}</div>
                
                <label style="font-size:12px; color:#64748b;">定位</label>
                <select class="sc-select" id="sc-edit-type">
                  <option value="none" ${role.type === 'none' ? 'selected' : ''}>平民</option>
                  <option value="concubine" ${role.type === 'concubine' ? 'selected' : ''}>后宫妃嫔</option>
                  <option value="official" ${role.type === 'official' ? 'selected' : ''}>朝堂朝臣</option>
                </select>

                <label style="font-size:12px; color:#64748b;">封号 / 官职</label>
                <input class="sc-input" type="text" id="sc-edit-title" value="${esc(role.title)}">

                <label style="font-size:12px; color:#64748b;">品级 (1-9品)</label>
                <input class="sc-input" type="text" id="sc-edit-rank" value="${esc(role.rank)}">

                <label style="font-size:12px; color:#64748b;">世家背景</label>
                <textarea class="sc-input" style="height:70px; resize:none;" id="sc-edit-bg">${esc(role.background)}</textarea>

                <div style="display:flex; gap:12px; margin-top:12px;">
                  <button class="sc-btn" style="flex:1;" id="sc-edit-cancel">取消</button>
                  <button class="sc-btn sc-btn-primary" style="flex:1;" id="sc-edit-save">保存</button>
                </div>
              </div>
            `;

            container.querySelector('#sc-edit-cancel').onclick = () => {
              renderTab();
            };

            container.querySelector('#sc-edit-save').onclick = async () => {
              gameData.roles[charId] = {
                ...role,
                type: container.querySelector('#sc-edit-type').value,
                title: container.querySelector('#sc-edit-title').value,
                rank: container.querySelector('#sc-edit-rank').value,
                background: container.querySelector('#sc-edit-bg').value
              };
              await saveGameData();
              roche.ui.toast('数据已保存');
              renderTab();
            };
          };

          const renderSubView = () => {
            if (currentSubView === 'emperor') {
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">王朝设定</div>
                  
                  <label style="font-size:12px; color:#64748b;">国号</label>
                  <input class="sc-input" type="text" id="sc-set-dynasty" value="${esc(dynInfo.eraName)}">

                  <label style="font-size:12px; color:#64748b;">年号 (如：开元、万历)</label>
                  <input class="sc-input" type="text" id="sc-set-year" value="${esc(dynInfo.year)}">

                  <div style="display:flex; gap:12px; margin-top:12px;">
                    <button class="sc-btn" style="flex:1;" id="sc-set-back">取消</button>
                    <button class="sc-btn sc-btn-primary" style="flex:1;" id="sc-set-save">保存</button>
                  </div>
                </div>
              `;

              container.querySelector('#sc-set-back').onclick = () => { currentSubView = null; render(); };
              container.querySelector('#sc-set-save').onclick = async () => {
                dynInfo.eraName = container.querySelector('#sc-set-dynasty').value;
                dynInfo.year = container.querySelector('#sc-set-year').value;
                await roche.storage.set('dynasty_info', dynInfo);
                roche.ui.toast('王朝设定已更新');
                currentSubView = null;
                render();
              };

            } else if (currentSubView === 'draft') {
              let charOptions = listCharacters.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">选秀大典</div>
                  <label style="font-size:12px; color:#64748b;">大典秀女人选</label>
                  <select class="sc-select" id="sc-draft-char">${charOptions}</select>
                  
                  <button class="sc-btn sc-btn-primary" style="width:100%; margin-bottom:12px;" id="sc-btn-draft-speak">听其自陈</button>
                  
                  <div id="sc-draft-speech" class="sc-memorial-scroll" style="display:none;">请稍候...</div>

                  <div id="sc-draft-assign" style="display:none;">
                    <label style="font-size:12px; color:#64748b;">授封位份 (如：婕妤、美人)</label>
                    <input class="sc-input" type="text" id="sc-draft-title" placeholder="如：贵人">
                    
                    <label style="font-size:12px; color:#64748b;">品级 (1至9品)</label>
                    <input class="sc-input" type="text" id="sc-draft-rank" placeholder="如：五品">

                    <button class="sc-btn sc-btn-primary" style="width:100%;" id="sc-btn-draft-confirm">册封入宫</button>
                  </div>
                </div>
              `;

              const speechBox = container.querySelector('#sc-draft-speech');
              const assignBox = container.querySelector('#sc-draft-assign');

              container.querySelector('#sc-btn-draft-speak').onclick = async () => {
                const charId = container.querySelector('#sc-draft-char').value;
                const char = listCharacters.find(c => c.id === charId);
                if (!char) return;

                speechBox.style.display = 'block';
                speechBox.innerText = '请稍后...';
                assignBox.style.display = 'none';

                try {
                  const prompt = `你是角色【${char.name}】。在模拟场景中，你作为选秀女站在大殿前。请完全遵照你原有的性格、特征、性别设想，自然陈词。
                  【规范】：
                  1. 语言要通顺流畅。禁止无意义生造繁复古风套话。
                  2. 坚决禁止任何 emoji 表情符号。
                  3. 字数控制在100字左右。`;
                  
                  const res = await roche.ai.chat({
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.8
                  });
                  speechBox.innerHTML = esc(res.text);
                  assignBox.style.display = 'block';
                } catch (e) {
                  speechBox.innerText = '连接超时，请重试。';
                }
              };

              container.querySelector('#sc-btn-draft-confirm').onclick = async () => {
                const charId = container.querySelector('#sc-draft-char').value;
                const title = container.querySelector('#sc-draft-title').value || '贵人';
                const rank = container.querySelector('#sc-draft-rank').value || '五品';

                if (!gameData.roles[charId]) {
                  gameData.roles[charId] = { type: 'none', title: '', rank: '', background: '', npcs: [] };
                }
                gameData.roles[charId].type = 'concubine';
                gameData.roles[charId].title = title;
                gameData.roles[charId].rank = rank;

                await saveGameData();
                roche.ui.toast(`册立旨意已下`);
                currentSubView = null;
                render();
              };

            } else if (currentSubView === 'exam') {
              let charOptions = listCharacters.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">考校殿试</div>
                  <label style="font-size:12px; color:#64748b;">考生</label>
                  <select class="sc-select" id="sc-exam-char">${charOptions}</select>
                  
                  <label style="font-size:12px; color:#64748b;">策问命题</label>
                  <input class="sc-input" type="text" id="sc-exam-question" value="如何合理平抑粮价以安民生？">

                  <button class="sc-btn sc-btn-primary" style="width:100%; margin-bottom:12px;" id="sc-btn-exam-run">开始作答</button>

                  <div id="sc-exam-result" class="sc-memorial-scroll" style="display:none;">阅卷中...</div>

                  <div id="sc-exam-assign" style="display:none;">
                    <label style="font-size:12px; color:#64748b;">授予官职 (如：修撰、侍郎)</label>
                    <input class="sc-input" type="text" id="sc-exam-title" placeholder="如：修撰">
                    
                    <label style="font-size:12px; color:#64748b;">品级 (1-9品)</label>
                    <input class="sc-input" type="text" id="sc-exam-rank" placeholder="如：六品">

                    <button class="sc-btn sc-btn-primary" style="width:100%;" id="sc-btn-exam-confirm">钦点进士</button>
                  </div>
                </div>
              `;

              const resBox = container.querySelector('#sc-exam-result');
              const assignBox = container.querySelector('#sc-exam-assign');

              container.querySelector('#sc-btn-exam-run').onclick = async () => {
                const charId = container.querySelector('#sc-exam-char').value;
                const question = container.querySelector('#sc-exam-question').value;
                const char = listCharacters.find(c => c.id === charId);
                if (!char) return;

                resBox.style.display = 'block';
                resBox.innerText = '请稍候...';
                assignBox.style.display = 'none';

                try {
                  const prompt = `你是殿试考生【${char.name}】。考题为：“${question}”。
                  【规范】：
                  1. 结合你自身原本性格，进行流畅、平实的答卷。严禁堆积空洞做作的拟古套词。
                  2. 绝对遵循并体现你原本的性别特征。
                  3. 字数约150字，无任何 emoji。`;
                  
                  const res = await roche.ai.chat({
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                  });
                  resBox.innerHTML = esc(res.text);
                  assignBox.style.display = 'block';
                } catch (e) {
                  resBox.innerText = '接口返回异常。';
                }
              };

              container.querySelector('#sc-btn-exam-confirm').onclick = async () => {
                const charId = container.querySelector('#sc-exam-char').value;
                const title = container.querySelector('#sc-exam-title').value || '主事';
                const rank = container.querySelector('#sc-exam-rank').value || '六品';

                if (!gameData.roles[charId]) {
                  gameData.roles[charId] = { type: 'none', title: '', rank: '', background: '', npcs: [] };
                }
                gameData.roles[charId].type = 'official';
                gameData.roles[charId].title = title;
                gameData.roles[charId].rank = rank;

                await saveGameData();
                roche.ui.toast(`任免已定。`);
                currentSubView = null;
                render();
              };

            } else if (currentSubView === 'background') {
              let charOptions = listCharacters.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">一键家世生成</div>
                  <label style="font-size:12px; color:#64748b;">选择角色</label>
                  <select class="sc-select" id="sc-bg-char">${charOptions}</select>

                  <button class="sc-btn sc-btn-primary" style="width:100%; margin-bottom:12px;" id="sc-btn-bg-run">生成背景与身边人</button>
                  <div id="sc-bg-result" class="sc-memorial-scroll" style="display:none; font-size:13px;">请稍后...</div>
                </div>
              `;

              const resBox = container.querySelector('#sc-bg-result');
              container.querySelector('#sc-btn-bg-run').onclick = async () => {
                const charId = container.querySelector('#sc-bg-char').value;
                const char = listCharacters.find(c => c.id === charId);
                if (!char) return;

                resBox.style.display = 'block';
                resBox.innerText = '查询整理中...';

                try {
                  const prompt = `你是一个古代家世设定生成器。请根据角色【${char.name}】（人设描述：${char.persona || char.bio || '无'}），生成一份该角色在朝代中的家族家世，以及最多5个NPC身边亲信或亲属。
                    【规范限制】：
                    1. 严格保留并遵循该角色的原设生理性别，严禁修改任何性别设定。
                    2. 必须输出纯净的以下JSON内容，禁止附带任何 markdown 包裹及任何 emoji 表情。
                    
                    {
                      "background": "京兆世家出身...",
                      "npcs": [
                        {"name": "沈大人", "relation": "父亲", "bio": "曾任通政使，为人严苛。"},
                        {"name": "沈青衣", "relation": "胞妹", "bio": "自幼聪慧，精通诗书。"}
                      ]
                    }`;

                  const res = await roche.ai.chat({
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.8
                  });

                  let cleanedText = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
                  let parsed = JSON.parse(cleanedText);

                  if (!gameData.roles[charId]) {
                    gameData.roles[charId] = { type: 'none', title: '', rank: '', background: '', npcs: [] };
                  }
                  gameData.roles[charId].background = parsed.background || '家世清白';
                  gameData.roles[charId].npcs = (parsed.npcs || []).slice(0, 5);

                  await saveGameData();

                  let html = `<strong>世家家世：</strong><br>${esc(gameData.roles[charId].background)}<br><br><strong>戚族身边人 (已写入卷宗，可在卷宗增删)：</strong><br>`;
                  gameData.roles[charId].npcs.forEach((n, idx) => {
                    html += `${idx + 1}. ${esc(n.name)} (${esc(n.relation)}) - ${esc(n.bio)}<br>`;
                  });

                  resBox.innerHTML = html;
                } catch (err) {
                  resBox.innerText = '系统解析异常，请重试。';
                }
              };

            } else if (currentSubView === 'memorials') {
              const mList = gameData.memorials || [];

              const renderMemorialCard = () => {
                if (mList.length === 0) {
                  viewContainer.innerHTML = `
                    <div class="sc-card">
                      <div class="sc-card-title">批阅奏折</div>
                      <div style="text-align:center; padding:30px 0; color:#64748b; font-size:14px;">暂面积存本章。</div>
                      <button class="sc-btn sc-btn-primary" style="width:100%;" id="sc-btn-gen-memo">呈递新疏</button>
                    </div>
                  `;

                  container.querySelector('#sc-btn-gen-memo').onclick = async () => {
                    await generateNewMemorial();
                  };
                  return;
                }

                const currentMemo = mList[0];
                viewContainer.innerHTML = `
                  <div class="sc-card">
                    <div class="sc-card-title">臣僚章奏</div>
                    <div class="sc-memorial-scroll">
                      <div style="font-weight:600; font-size:15px; margin-bottom:4px;">《${esc(currentMemo.title)}》</div>
                      <span style="font-size:12px; color:#64748b; display:block; margin-bottom:12px;">呈奏人：${esc(currentMemo.author)}</span>
                      <p style="white-space:pre-wrap; margin:0; font-size:13px; line-height:1.6;">${esc(currentMemo.content)}</p>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:8px;">
                      ${(currentMemo.options || []).map((opt, i) => `
                        <button class="sc-btn" id="sc-btn-memo-opt-${i}">${esc(opt.text)}</button>
                      `).join('')}
                    </div>
                  </div>
                `;

                currentMemo.options.forEach((opt, i) => {
                  container.querySelector(`#sc-btn-memo-opt-${i}`).onclick = async () => {
                    roche.ui.toast(`已予裁定。${opt.effect}`);
                    gameData.memorials.shift();
                    await saveGameData();
                    renderMemorialCard();
                  };
                });
              };

              const generateNewMemorial = async () => {
                roche.ui.toast('传拟奏疏...');
                try {
                  let officials = Object.entries(gameData.roles)
                    .filter(([_, r]) => r.type === 'official')
                    .map(([id, _]) => listCharacters.find(c => c.id === id))
                    .filter(Boolean)
                    .map(c => c.name);

                  let concubines = Object.entries(gameData.roles)
                    .filter(([_, r]) => r.type === 'concubine')
                    .map(([id, _]) => listCharacters.find(c => c.id === id))
                    .filter(Boolean)
                    .map(c => c.name);

                  const prompt = `请设计并生成一封由臣工呈交的古代政务或宫掖利益诉求折本。
                    可结合已有朝廷重臣【${officials.join(', ') || '重臣'}】，或者后宫势力【${concubines.join(', ') || '嫔妃'}】。内容可涉及弹劾、求恩典、求调拨粮饷等。
                    【限制】：
                    1. 严密保留所有涉及角色的真实生理性别，绝不改变性别。
                    2. 笔触平实通顺，不刻意堆积矫柔造作的繁重仿古套句。
                    3. 严格输出以下纯JSON数据，不要包含任何 markdown 标识包裹或任何 emoji。
                    
                    {
                      "title": "奏陈赈灾事宜本",
                      "author": "知府 陆某",
                      "content": "地方遭逢夏潦，民户田产浸没。请圣上早发国库，赈免民税...",
                      "options": [
                        { "text": "准奏，发银一万两", "effect": "灾民获安，但国库吃紧。" },
                        { "text": "暂缓，令豪绅劝捐", "effect": "豪绅不满，安抚成效有限。" }
                      ]
                    }`;

                  const res = await roche.ai.chat({
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.85
                  });

                  let cleanedText = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
                  let parsed = JSON.parse(cleanedText);

                  if (!gameData.memorials) gameData.memorials = [];
                  gameData.memorials.push({
                    id: uuid(),
                    title: parsed.title || '无标题奏本',
                    author: parsed.author || '臣工无名',
                    content: parsed.content || '空无内容。',
                    options: parsed.options || [{ text: '阅', effect: '无。' }]
                  });

                  await saveGameData();
                  renderMemorialCard();
                } catch (e) {
                  roche.ui.toast('生成失败，请重试。');
                }
              };

              renderMemorialCard();

            } else if (currentSubView === 'harem') {
              const haremList = Object.entries(gameData.roles)
                .filter(([_, r]) => r.type === 'concubine')
                .map(([id, r]) => {
                  const char = listCharacters.find(c => c.id === id);
                  return char ? { ...r, char } : null;
                })
                .filter(Boolean);

              if (haremList.length === 0) {
                viewContainer.innerHTML = `
                  <div class="sc-card">
                    <div class="sc-card-title">后宫妃嫔</div>
                    <div style="text-align:center; padding: 40px 10px; color:#64748b; font-size:14px;">
                      后宫空无一人。请先进行秀选。
                    </div>
                  </div>
                `;
                return;
              }

              // 列表交互重构：纯现代 SVG 图标，无字简约化设计 [4]
              let html = `<div class="sc-card"><div class="sc-card-title">后宫召见</div>`;
              haremList.forEach(item => {
                const charName = item.char.name;
                html += `
                  <div class="sc-list-item">
                    <div>
                      <strong style="color:#0f172a;">${esc(charName)}</strong>
                      <span style="font-size:12px; color:#64748b; margin-left:8px;">【${esc(item.title)}】 (${esc(item.rank ? item.rank + '品' : '无')})</span>
                    </div>
                    <div style="display:flex; gap: 8px;">
                      <button class="sc-btn-icon" id="sc-btn-harem-promote-${item.char.id}" title="晋升位分">${ICONS.up}</button>
                      <button class="sc-btn-icon" id="sc-btn-harem-demote-${item.char.id}" title="贬退责罚">${ICONS.down}</button>
                      <button class="sc-btn-icon sc-btn-primary" id="sc-btn-harem-stay-${item.char.id}" title="召见留宿">${ICONS.chat}</button>
                    </div>
                  </div>
                `;
              });
              html += `</div>`;

              viewContainer.innerHTML = html;

              haremList.forEach(item => {
                const cid = item.char.id;

                container.querySelector(`#sc-btn-harem-promote-${cid}`).onclick = async () => {
                  const newTitle = await promptInputText('晋位', '拟定册晋称号');
                  if (newTitle) {
                    gameData.roles[cid].title = newTitle;
                    await saveGameData();
                    roche.ui.toast(`已晋 ${esc(item.char.name)} 为：${esc(newTitle)}。`);
                    renderSubView();
                  }
                };

                container.querySelector(`#sc-btn-harem-demote-${cid}`).onclick = async () => {
                  const newTitle = await promptInputText('贬位', '拟定降免称号');
                  if (newTitle) {
                    gameData.roles[cid].title = newTitle;
                    await saveGameData();
                    roche.ui.toast(`已黜 ${esc(item.char.name)} 为：${esc(newTitle)}。`);
                    renderSubView();
                  }
                };

                container.querySelector(`#sc-btn-harem-stay-${cid}`).onclick = async () => {
                  const newSessId = uuid();
                  if (!gameData.sessions) gameData.sessions = [];
                  gameData.sessions.push({
                    id: newSessId,
                    type: 'overnight',
                    charId: cid,
                    messages: []
                  });
                  await saveGameData();
                  activeChatSessionId = newSessId;
                  currentSubView = 'chat';
                  render();
                };
              });

            } else if (currentSubView === 'study') {
              const officialList = Object.entries(gameData.roles)
                .filter(([_, r]) => r.type === 'official')
                .map(([id, r]) => {
                  const char = listCharacters.find(c => c.id === id);
                  return char ? { ...r, char } : null;
                })
                .filter(Boolean);

              if (officialList.length === 0) {
                viewContainer.innerHTML = `
                  <div class="sc-card">
                    <div class="sc-card-title">阁臣重臣</div>
                    <div style="text-align:center; padding: 40px 10px; color:#64748b; font-size:14px;">
                      朝中无欽定官员。请先进行殿试。
                    </div>
                  </div>
                `;
                return;
              }

              let html = `<div class="sc-card"><div class="sc-card-title">御书前殿</div>`;
              officialList.forEach(item => {
                const charName = item.char.name;
                html += `
                  <div class="sc-list-item">
                    <div>
                      <strong style="color:#0f172a;">${esc(charName)}</strong>
                      <span style="font-size:12px; color:#64748b; margin-left:8px;">【${esc(item.title)}】 (${esc(item.rank ? item.rank + '品' : '无')})</span>
                    </div>
                    <div style="display:flex; gap: 8px;">
                      <button class="sc-btn-icon" id="sc-btn-study-promote-${item.char.id}" title="晋升任免">${ICONS.up}</button>
                      <button class="sc-btn-icon" id="sc-btn-study-demote-${item.char.id}" title="降免黜调">${ICONS.down}</button>
                      <button class="sc-btn-icon sc-btn-primary" id="sc-btn-study-chat-${item.char.id}" title="传召面唔">${ICONS.chat}</button>
                    </div>
                  </div>
                `;
              });
              html += `</div>`;

              viewContainer.innerHTML = html;

              officialList.forEach(item => {
                const cid = item.char.id;

                container.querySelector(`#sc-btn-study-promote-${cid}`).onclick = async () => {
                  const newTitle = await promptInputText('升任', '拟定高升之任职衔');
                  if (newTitle) {
                    gameData.roles[cid].title = newTitle;
                    await saveGameData();
                    roche.ui.toast(`已任 ${esc(item.char.name)} 为：${esc(newTitle)}。`);
                    renderSubView();
                  }
                };

                container.querySelector(`#sc-btn-study-demote-${cid}`).onclick = async () => {
                  const newTitle = await promptInputText('降调', '拟定斥调新官职');
                  if (newTitle) {
                    gameData.roles[cid].title = newTitle;
                    await saveGameData();
                    roche.ui.toast(`已贬 ${esc(item.char.name)} 为：${esc(newTitle)}。`);
                    renderSubView();
                  }
                };

                container.querySelector(`#sc-btn-study-chat-${cid}`).onclick = async () => {
                  const newSessId = uuid();
                  if (!gameData.sessions) gameData.sessions = [];
                  gameData.sessions.push({
                    id: newSessId,
                    type: 'secret',
                    charId: cid,
                    messages: []
                  });
                  await saveGameData();
                  activeChatSessionId = newSessId;
                  currentSubView = 'chat';
                  render();
                };
              });

            } else if (currentSubView === 'chat') {
              const session = gameData.sessions.find(s => s.id === activeChatSessionId);
              if (!session) {
                currentSubView = null;
                render();
                return;
              }

              const char = listCharacters.find(c => c.id === session.charId);
              const name = char ? char.name : '未知角色';
              const role = gameData.roles[session.charId] || {};

              viewContainer.innerHTML = `
                <div class="sc-chat-container">
                  <div class="sc-chat-history" id="sc-chat-msg-box"></div>
                  <div class="sc-chat-input-area">
                    <input class="sc-chat-input" id="sc-chat-input-dom" placeholder="输入问话、裁定..." />
                    <button class="sc-btn sc-btn-primary" id="sc-btn-chat-send" style="padding:10px 16px;">垂问</button>
                  </div>
                </div>
              `;

              const msgBox = container.querySelector('#sc-chat-msg-box');
              const inputDom = container.querySelector('#sc-chat-input-dom');

              const renderChatHistory = () => {
                if (session.messages.length === 0) {
                  msgBox.innerHTML = `
                    <div class="sc-chat-msg narrative">
                      【${esc(name)}】 (${role.title ? esc(role.title) : '待命'}) 侍立于前。请发布指示开启密会面晤。
                    </div>
                  `;
                  return;
                }

                let html = '';
                session.messages.forEach(m => {
                  if (m.role === 'user') {
                    html += `
                      <div class="sc-chat-msg user">
                        <div class="sc-chat-msg-sender">圣意</div>
                        <div class="msg-content">${esc(m.text)}</div>
                      </div>
                    `;
                  } else {
                    html += `
                      <div class="sc-chat-msg narrative">
                        ${esc(m.text)}
                      </div>
                    `;
                  }
                });
                msgBox.innerHTML = html;
                msgBox.scrollTop = msgBox.scrollHeight;
              };

              const sendChatMessage = async () => {
                const text = inputDom.value.trim();
                if (!text || isAiThinking) return;

                session.messages.push({ role: 'user', text });
                inputDom.value = '';
                renderChatHistory();
                await saveGameData();

                // 启动 AI 请求状态，顶部动态变更为“输入中……” [1]
                isAiThinking = true;
                renderHeader();

                const systemPrompt = `你正在协助用户演绎模拟场景互动。
                  场景：${session.type === 'overnight' ? '后宫密室留宿' : '御书前殿密晤'}。
                  对象：【${char.name}】（封号职衔：【${role.title || '无'}】，品级：【${role.rank || '无'}】）。
                  家世背景：【${role.background || '无'}】。
                  
                  【行为指引规约】：
                  1. 绝对恪守并保留该角色原本设定的性别属性，绝不擅加颠倒更改；用户性别不予规定。
                  2. 坚决摒弃网络流行语与庸俗、空泛做作的陈腐仿古套句，行文通顺听着顺耳、利落明朗。
                  3. 纯净运用第三人称白描自然叙事，描述【${char.name}】的动作反应。代称用户时用“您”或“陛下”。
                  4. 严格禁止包含任何表情符号 (emoji)。
                  5. 单次内容回复严格控制在 100 字左右，注重叙述节奏。`;

                let payloadMessages = [
                  { role: 'system', content: systemPrompt }
                ];
                session.messages.forEach(m => {
                  payloadMessages.push({
                    role: m.role,
                    content: m.role === 'user' ? `皇帝有旨：${m.text}` : m.text
                  });
                });

                try {
                  const response = await roche.ai.chat({
                    messages: payloadMessages,
                    temperature: 0.75
                  });
                  session.messages.push({ role: 'assistant', text: response.text });
                  await saveGameData();
                } catch (e) {
                  session.messages.push({ role: 'assistant', text: '对话暂无反馈，请改日再叙。' });
                  await saveGameData();
                } finally {
                  // 回复完成后恢复普通头部
                  isAiThinking = false;
                  renderHeader();
                  renderChatHistory();
                }
              };

              container.querySelector('#sc-btn-chat-send').onclick = sendChatMessage;
              inputDom.onkeydown = (e) => { if (e.key === 'Enter') sendChatMessage(); };

              renderChatHistory();
            }
          };

          const promptInputText = (title, message) => {
            return new Promise((resolve) => {
              const mask = document.createElement('div');
              mask.style.cssText = `
                position: absolute; top:0; left:0; right:0; bottom:0;
                background-color: rgba(15, 23, 42, 0.4);
                display: flex; align-items: center; justify-content: center;
                z-index: 1000; padding: 20px;
              `;

              mask.innerHTML = `
                <div class="sc-card" style="width:100%; max-width: 320px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                  <div class="sc-card-title">${esc(title)}</div>
                  <div style="font-size:12px; color:#64748b; margin-bottom: 8px;">${esc(message)}</div>
                  <input class="sc-input" type="text" id="sc-modal-input-val" style="margin-bottom: 12px;">
                  <div style="display:flex; gap: 8px;">
                    <button class="sc-btn" style="flex:1;" id="sc-modal-cancel">放弃</button>
                    <button class="sc-btn sc-btn-primary" style="flex:1;" id="sc-modal-ok">确定</button>
                  </div>
                </div>
              `;

              container.querySelector('.roche-plugin-shangchao').appendChild(mask);
              const inputDom = mask.querySelector('#sc-modal-input-val');
              inputDom.focus();

              mask.querySelector('#sc-modal-cancel').onclick = () => {
                mask.remove();
                resolve(null);
              };

              mask.querySelector('#sc-modal-ok').onclick = () => {
                const val = inputDom.value.trim();
                mask.remove();
                resolve(val);
              };
            });
          };

          await loadAllData();

          container.querySelectorAll('.sc-dock-item').forEach(btn => {
            btn.onclick = () => {
              switchTab(btn.getAttribute('data-tab'));
            };
          });

          render();
        },

        async unmount(container, roche) {
          const style = document.getElementById(STYLE_ID);
          if (style) style.remove();
          container.replaceChildren();
        }
      }
    ]
  });
})();