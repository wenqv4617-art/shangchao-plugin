(function () {
  // 辅助函数：HTML转义防注入
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

  // 通用 SVG 矢量图标
  const ICONS = {
    home: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    sessions: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    archives: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    back: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
    edit: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>`
  };

  const STYLE_ID = 'roche-plugin-shangchao-style';

  // 现代浅色、极简无衬线 Slate + Indigo 视觉设计
  const STYLES = `
    .roche-plugin-shangchao {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background-color: #f8fafc;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
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
      letter-spacing: 0.5px;
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
    /* 存在Dock栏时给底部留出空间 */
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
    /* 仅在主页签下展示Dock */
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
      color: #4f46e5;
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
    .sc-btn-primary {
      background-color: #4f46e5;
      border-color: #4f46e5;
      color: #ffffff;
    }
    .sc-btn-primary:hover {
      background-color: #4338ca;
      border-color: #4338ca;
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
      border-color: #4f46e5;
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
    /* 折叠面板 (卷宗专用) */
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
      color: #4f46e5;
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
    /* 对话容器样式 */
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
      border-color: #4f46e5;
    }
    /* 奏折白描板式 */
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

  // 默认王朝信息
  const DEFAULT_DYNASTY = {
    eraName: '大燕',
    year: '元'
  };

  window.RochePlugin.register({
    id: 'shangchao-plugin',
    name: '上朝！',
    version: '1.1.0',
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

          // 初始化SPA基础架构
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

          // 核心渲染管理器
          const render = () => {
            renderHeader();

            // 如果处于二级页面或召见会话页，隐藏底部导航
            if (currentSubView) {
              mainWrapper.classList.remove('has-dock');
              renderSubView();
            } else {
              mainWrapper.classList.add('has-dock');
              renderTab();
            }
          };

          // 动态渲染顶部栏与安全退出按钮
          const renderHeader = () => {
            if (currentSubView) {
              // 二级视图：退出按钮放左上角
              headerContainer.innerHTML = `
                <button class="sc-header-btn" id="sc-header-back-btn">
                  ${ICONS.back} <span>返回</span>
                </button>
                <div class="sc-header-title">【${esc(dynInfo.eraName)}】${esc(dynInfo.year)}年</div>
                <div style="width:72px;"></div> 
              `;
              headerContainer.querySelector('#sc-header-back-btn').onclick = () => {
                currentSubView = null;
                activeChatSessionId = null;
                render();
              };
            } else {
              // 一级视图：右上角放置退出按钮
              headerContainer.innerHTML = `
                <div class="sc-header-title">
                  上朝！
                  <span class="sc-dynasty-badge">【${esc(dynInfo.eraName)}】${esc(dynInfo.year)}年</span>
                </div>
                <button class="sc-header-btn" id="sc-header-close-btn">
                  <span>退出</span>
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
                  <div class="sc-card-title">天下巡视</div>
                  <div class="sc-grid">
                    <button class="sc-btn" id="sc-nav-harem" style="border-color: #f43f5e; color:#e11d48; background-color:#fff1f2;">后宫召见</button>
                    <button class="sc-btn" id="sc-nav-study" style="border-color: #0284c7; color:#0369a1; background-color:#f0f9ff;">御书房召见</button>
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
                    暂无正在进行中的留宿与密谈会话。
                  </div>
                `;
                return;
              }

              let html = `<div class="sc-card"><div class="sc-card-title">进行中的召见</div>`;
              sList.forEach((s) => {
                const char = listCharacters.find(c => c.id === s.charId);
                const name = char ? char.name : '未知角色'; // 严格使用本名
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
                const role = gameData.roles[c.id] || { type: 'none', title: '平民', rank: '' };
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

                // 详情过长时，采用原生 details summary 折叠
                html += `
                  <div style="padding:14px 0; border-bottom:1px solid #f1f5f9;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-weight:600; font-size:15px; color:#0f172a;">${esc(c.name)}</span>
                      <span class="sc-badge ${badgeClass}">${esc(badgeText)} - ${esc(role.title || '无')} ${esc(role.rank ? role.rank + '品' : '')}</span>
                    </div>
                    
                    <details class="sc-archive-details">
                      <summary>展开查看背景档案</summary>
                      <div class="sc-archive-content">
                        <div style="margin-bottom:8px;"><strong>家世：</strong>${esc(bg)}</div>
                        <div>
                          <strong>亲属戚党 (${npcs.length}/5)：</strong>
                          ${npcs.length === 0 ? '暂无记录' : npcs.map(n => `${esc(n.name)} (${esc(n.relation)}: ${esc(n.bio)})`).join('；')}
                        </div>
                      </div>
                    </details>

                    <div style="margin-top:10px; text-align:right;">
                      <button class="sc-btn" style="padding:4px 8px; font-size:12px;" id="sc-btn-edit-arch-${c.id}">修改属性</button>
                    </div>
                  </div>
                `;
              });
              listDiv.innerHTML = html;

              listCharacters.forEach(c => {
                container.querySelector(`#sc-btn-edit-arch-${c.id}`).onclick = () => {
                  openEditArchiveModal(c.id);
                };
              });
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
                  
                  <label style="font-size:12px; color:#64748b;">帝国/王朝国号</label>
                  <input class="sc-input" type="text" id="sc-set-dynasty" value="${esc(dynInfo.eraName)}">

                  <label style="font-size:12px; color:#64748b;">当前年号 (如：开元、万历)</label>
                  <input class="sc-input" type="text" id="sc-set-year" value="${esc(dynInfo.year)}">

                  <div style="display:flex; gap:12px; margin-top:12px;">
                    <button class="sc-btn" style="flex:1;" id="sc-set-back">取消</button>
                    <button class="sc-btn sc-btn-primary" style="flex:1;" id="sc-set-save">保存修改</button>
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
                  <div class="sc-card-title">大典秀选</div>
                  <label style="font-size:12px; color:#64748b;">请选择人选</label>
                  <select class="sc-select" id="sc-draft-char">${charOptions}</select>
                  
                  <button class="sc-btn sc-btn-primary" style="width:100%; margin-bottom:12px;" id="sc-btn-draft-speak">听取言谈</button>
                  
                  <div id="sc-draft-speech" class="sc-memorial-scroll" style="display:none;">聆听中...</div>

                  <div id="sc-draft-assign" style="display:none;">
                    <label style="font-size:12px; color:#64748b;">新封位份 (如：贵妃、昭仪、婕妤)</label>
                    <input class="sc-input" type="text" id="sc-draft-title" placeholder="如：婕妤">
                    
                    <label style="font-size:12px; color:#64748b;">品级 (1至9品)</label>
                    <input class="sc-input" type="text" id="sc-draft-rank" placeholder="如：三品">

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
                  const prompt = `你是角色【${char.name}】。在模拟王朝场景中，你作为候选秀女站在殿前，接受皇帝的考核。
                  请完全遵照你原有的性格、特征、人设和生理性别进行自然的表白。
                  【格式规范】：
                  1. 使用通顺流畅的自然语言。禁止刻意填充大篇幅浮夸陈旧的古风废话。
                  2. 坚决禁止任何表情符号(emoji)。
                  3. 字数控制在100字左右。`;
                  
                  const res = await roche.ai.chat({
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.8
                  });
                  speechBox.innerHTML = esc(res.text);
                  assignBox.style.display = 'block';
                } catch (e) {
                  speechBox.innerText = '系统连接超时，请重试。';
                }
              };

              container.querySelector('#sc-btn-draft-confirm').onclick = async () => {
                const charId = container.querySelector('#sc-draft-char').value;
                const title = container.querySelector('#sc-draft-title').value || '才人';
                const rank = container.querySelector('#sc-draft-rank').value || '五品';

                if (!gameData.roles[charId]) {
                  gameData.roles[charId] = { type: 'none', title: '', rank: '', background: '', npcs: [] };
                }
                gameData.roles[charId].type = 'concubine';
                gameData.roles[charId].title = title;
                gameData.roles[charId].rank = rank;

                await saveGameData();
                roche.ui.toast(`册封指令已发。`);
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
                  
                  <label style="font-size:12px; color:#64748b;">命题</label>
                  <input class="sc-input" type="text" id="sc-exam-question" value="如何合理平抑粮价以安民生？">

                  <button class="sc-btn sc-btn-primary" style="width:100%; margin-bottom:12px;" id="sc-btn-exam-run">开始作答</button>

                  <div id="sc-exam-result" class="sc-memorial-scroll" style="display:none;">阅卷中...</div>

                  <div id="sc-exam-assign" style="display:none;">
                    <label style="font-size:12px; color:#64748b;">授予官职 (如：大学士、侍郎、中书)</label>
                    <input class="sc-input" type="text" id="sc-exam-title" placeholder="如：修撰">
                    
                    <label style="font-size:12px; color:#64748b;">品级 (1-9品)</label>
                    <input class="sc-input" type="text" id="sc-exam-rank" placeholder="如：六品">

                    <button class="sc-btn sc-btn-primary" style="width:100%;" id="sc-btn-exam-confirm">授予官职</button>
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
                  const prompt = `你是考生【${char.name}】。在本次科举考核中，面对考题：“${question}”，请给出你的策论答卷。
                  【格式规范】：
                  1. 结合角色自身人设，使用清爽、利落的书面文笔进行答辩。禁止塞满矫作蹩脚、空洞无物的生造古风陈词滥调。
                  2. 严格尊重并遵从你设定的性别。
                  3. 字数限制在150-200字左右，不包含任何emoji。`;
                  
                  const res = await roche.ai.chat({
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                  });
                  resBox.innerHTML = esc(res.text);
                  assignBox.style.display = 'block';
                } catch (e) {
                  resBox.innerText = '调用接口失败。';
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
                roche.ui.toast(`官制册立完毕。`);
                currentSubView = null;
                render();
              };

            } else if (currentSubView === 'background') {
              let charOptions = listCharacters.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">一键家世身边人</div>
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
                resBox.innerText = '查询中...';

                try {
                  const prompt = `你现在是一个家世背景生成器。请根据角色【${char.name}】（原有背景属性：${char.persona || char.bio || '无'}），为该角色派生家族家世，以及不超过5个NPC身边亲信/戚属成员。
                    【限制要求】：
                    1. 严格保留该角色设定的性别属性，禁止改变任何男女倾向设定。
                    2. 必须输出以下纯净JSON数据，不要包含任何markdown标记包裹、不要带有任何emoji。
                    
                    {
                      "background": "江南百年书香世家出身...",
                      "npcs": [
                        {"name": "沈阁老", "relation": "父亲", "bio": "曾任户部侍郎，朝中人脉极广。"},
                        {"name": "沈青羽", "relation": "同胞弟弟", "bio": "性子跳脱，好侠义事。"}
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

                  let html = `<strong>家世：</strong><br>${esc(gameData.roles[charId].background)}<br><br><strong>亲眷身侧 (已折叠在卷宗)：</strong><br>`;
                  gameData.roles[charId].npcs.forEach((n, idx) => {
                    html += `${idx + 1}. ${esc(n.name)} (${esc(n.relation)}) - ${esc(n.bio)}<br>`;
                  });

                  resBox.innerHTML = html;
                } catch (err) {
                  resBox.innerText = '解析生成失败，请重试。';
                }
              };

            } else if (currentSubView === 'memorials') {
              const mList = gameData.memorials || [];

              const renderMemorialCard = () => {
                if (mList.length === 0) {
                  viewContainer.innerHTML = `
                    <div class="sc-card">
                      <div class="sc-card-title">批阅奏折</div>
                      <div style="text-align:center; padding:30px 0; color:#64748b; font-size:14px;">暂无未批阅的奏折。</div>
                      <button class="sc-btn sc-btn-primary" style="width:100%;" id="sc-btn-gen-memo">呈递新折子</button>
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
                    <div class="sc-card-title">臣工折奏</div>
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
                    roche.ui.toast(`裁处成功。${opt.effect}`);
                    gameData.memorials.shift();
                    await saveGameData();
                    renderMemorialCard();
                  };
                });
              };

              const generateNewMemorial = async () => {
                roche.ui.toast('拟折中...');
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

                  const prompt = `请生成一封古代大臣上呈的奏疏折本。
                    可结合已有朝臣【${officials.join(', ') || '重臣'}】或后宫【${concubines.join(', ') || '嫔妃'}】。内容涉及地方军政、赈灾救济、弹劾排挤或邀宠。
                    【限制要求】：
                    1. 严格确保涉及人物原本的生理性别，绝不改变任何人的性别设定。
                    2. 文笔要自然简明，不可堆积庸俗繁琐的陈旧仿古句式。
                    3. 严格输出以下JSON，绝不包含任何emoji、markdown代码块。
                    
                    {
                      "title": "奏陈地方疏",
                      "author": "巡抚张某",
                      "content": "近来秋收欠收，百姓无粮，恐有民变，请拨粮饷数万石...",
                      "options": [
                        { "text": "准奏，开仓赈济", "effect": "民情趋于稳定，但库粮消耗较大。" },
                        { "text": "驳回，自行解决", "effect": "地方局势吃紧，人心难平。" }
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
                  roche.ui.toast('生成失败。');
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
                      后宫无人。请先举行选秀。
                    </div>
                  </div>
                `;
                return;
              }

              let html = `<div class="sc-card"><div class="sc-card-title">后宫召见</div>`;
              haremList.forEach(item => {
                const charName = item.char.name; // 严格使用本名
                html += `
                  <div class="sc-list-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <strong style="color:#0f172a;">${esc(charName)}</strong>
                        <span style="font-size:12px; color:#64748b; margin-left:8px;">【${esc(item.title)}】 (${esc(item.rank ? item.rank + '品' : '无')})</span>
                      </div>
                    </div>
                    <div style="display:flex; gap: 8px;">
                      <button class="sc-btn" style="padding:4px 8px; font-size:12px;" id="sc-btn-harem-promote-${item.char.id}">晋升</button>
                      <button class="sc-btn" style="padding:4px 8px; font-size:12px;" id="sc-btn-harem-demote-${item.char.id}">贬退</button>
                      <button class="sc-btn sc-btn-primary" style="padding:4px 12px; font-size:12px;" id="sc-btn-harem-stay-${item.char.id}">召见留宿</button>
                    </div>
                  </div>
                `;
              });
              html += `</div>`;

              viewContainer.innerHTML = html;

              haremList.forEach(item => {
                const cid = item.char.id;

                container.querySelector(`#sc-btn-harem-promote-${cid}`).onclick = async () => {
                  const newTitle = await promptInputText('晋封位位', '拟定册立新称号（如：贵妃、昭仪）');
                  if (newTitle) {
                    gameData.roles[cid].title = newTitle;
                    await saveGameData();
                    roche.ui.toast(`已降旨：晋 ${esc(item.char.name)} 为：${esc(newTitle)}。`);
                    renderSubView();
                  }
                };

                container.querySelector(`#sc-btn-harem-demote-${cid}`).onclick = async () => {
                  const newTitle = await promptInputText('贬退黜责', '拟降贬新名号（如：答应、常在）');
                  if (newTitle) {
                    gameData.roles[cid].title = newTitle;
                    await saveGameData();
                    roche.ui.toast(`已裁决：降 ${esc(item.char.name)} 为：${esc(newTitle)}。`);
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
                    <div class="sc-card-title">阁僚朝臣</div>
                    <div style="text-align:center; padding: 40px 10px; color:#64748b; font-size:14px;">
                      朝中无任免官员。请举行科考。
                    </div>
                  </div>
                `;
                return;
              }

              let html = `<div class="sc-card"><div class="sc-card-title">御书前殿</div>`;
              officialList.forEach(item => {
                const charName = item.char.name; // 严格使用本名
                html += `
                  <div class="sc-list-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <strong style="color:#0f172a;">${esc(charName)}</strong>
                        <span style="font-size:12px; color:#64748b; margin-left:8px;">【${esc(item.title)}】 (${esc(item.rank ? item.rank + '品' : '无')})</span>
                      </div>
                    </div>
                    <div style="display:flex; gap: 8px;">
                      <button class="sc-btn" style="padding:4px 8px; font-size:12px;" id="sc-btn-study-promote-${item.char.id}">高升</button>
                      <button class="sc-btn" style="padding:4px 8px; font-size:12px;" id="sc-btn-study-demote-${item.char.id}">贬退</button>
                      <button class="sc-btn sc-btn-primary" style="padding:4px 12px; font-size:12px;" id="sc-btn-study-chat-${item.char.id}">密传面晤</button>
                    </div>
                  </div>
                `;
              });
              html += `</div>`;

              viewContainer.innerHTML = html;

              officialList.forEach(item => {
                const cid = item.char.id;

                container.querySelector(`#sc-btn-study-promote-${cid}`).onclick = async () => {
                  const newTitle = await promptInputText('晋级升调', '拟定晋升之职衔（如：大学士、侍郎）');
                  if (newTitle) {
                    gameData.roles[cid].title = newTitle;
                    await saveGameData();
                    roche.ui.toast(`已晋任：${esc(item.char.name)} 为：${esc(newTitle)}。`);
                    renderSubView();
                  }
                };

                container.querySelector(`#sc-btn-study-demote-${cid}`).onclick = async () => {
                  const newTitle = await promptInputText('撤免贬调', '拟降级新官职（如：知府、主事）');
                  if (newTitle) {
                    gameData.roles[cid].title = newTitle;
                    await saveGameData();
                    roche.ui.toast(`已黜调：${esc(item.char.name)} 贬为：${esc(newTitle)}。`);
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
              // 模拟长叙事会话页面，此时Dock栏完全隐藏
              const session = gameData.sessions.find(s => s.id === activeChatSessionId);
              if (!session) {
                currentSubView = null;
                render();
                return;
              }

              const char = listCharacters.find(c => c.id === session.charId);
              const name = char ? char.name : '未知角色'; // 严格使用本名
              const role = gameData.roles[session.charId] || {};

              viewContainer.innerHTML = `
                <div class="sc-chat-container">
                  <div class="sc-chat-history" id="sc-chat-msg-box"></div>
                  <div class="sc-chat-input-area">
                    <input class="sc-chat-input" id="sc-chat-input-dom" placeholder="输入对话裁断..." />
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
                      【${esc(name)}】 (${role.title ? esc(role.title) : '待命'}) 恭敬等候您的召见，四周寂静，请发布指示或开启对话。
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
                if (!text) return;

                session.messages.push({ role: 'user', text });
                inputDom.value = '';
                renderChatHistory();
                await saveGameData();

                // 交互描述提示词设定：绝对遵循性别、不堆积套话、简明流畅白描
                const systemPrompt = `你正在协助用户进行互动模拟演出。
                  场景：${session.type === 'overnight' ? '后宫密处召见' : '御书房极密面谈'}。
                  对方：【${char.name}】（封号职衔：【${role.title || '无'}】，品级：【${role.rank || '无'}】）。
                  家世背景：【${role.background || '无'}】。
                  
                  【核心规范约束】：
                  1. 绝对保护并遵从该角色原本设定的生理性别，禁止在互动中擅自更改、扭转男女倾向；用户的性别无需定义。
                  2. 坚决摒弃生搬硬套、冗长突兀、假大空的古装陈腐语料和网络烂梗，行文应当干练、干净、流畅，好听自然。
                  3. 采用简约流畅的第三人称自然白描手法，描写【${char.name}】的神态举止和回答。代称用户时使用“您”或“陛下”。
                  4. 禁止包含任何 emoji 表情符号。
                  5. 单次内容回复控制在 100 字左右，保持节奏紧凑。`;

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
                  renderChatHistory();
                } catch (e) {
                  session.messages.push({ role: 'assistant', text: '对话中断，请稍后再试。' });
                  await saveGameData();
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
                    <button class="sc-btn" style="flex:1;" id="sc-modal-cancel">取消</button>
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