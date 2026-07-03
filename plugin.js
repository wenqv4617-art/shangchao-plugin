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

  // 辅助函数：生成UUID
  const uuid = () => {
    return 'sc_' + Math.random().toString(36).substring(2, 15);
  };

  // SVG 图标库
  const ICONS = {
    home: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    sessions: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    archives: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    back: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
    edit: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>`
  };

  const STYLE_ID = 'roche-plugin-shangchao-style';

  const STYLES = `
    .roche-plugin-shangchao {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background-color: #f7f5f0;
      color: #3a352a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Serif SC", serif;
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
      border-bottom: 1px solid #e3dec3;
      background-color: #fcfbfa;
    }
    .sc-header-title {
      font-size: 18px;
      font-weight: 600;
      color: #5c4e33;
      letter-spacing: 2px;
    }
    .sc-header-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: 1px solid #d4cca6;
      padding: 6px 12px;
      cursor: pointer;
      color: #5c4e33;
      font-size: 13px;
      border-radius: 4px;
      background-color: #fbf9f2;
    }
    .sc-header-btn:hover {
      background-color: #e3dec3;
    }
    .sc-viewport {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: 80px;
    }
    .sc-dock {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background-color: #fcfbfa;
      border-top: 1px solid #e3dec3;
      display: flex;
      justify-content: space-around;
      align-items: center;
      z-index: 10;
    }
    .sc-dock-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      color: #7c725c;
      font-size: 12px;
      cursor: pointer;
      flex: 1;
      height: 100%;
      gap: 4px;
      transition: color 0.2s, background-color 0.2s;
    }
    .sc-dock-item:hover {
      background-color: #f8f6ee;
    }
    .sc-dock-item.active {
      color: #a48235;
      font-weight: bold;
      background-color: #f3edd3;
    }
    .sc-card {
      background-color: #fcfbfa;
      border: 1px solid #e3dec3;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 2px 6px rgba(164, 130, 53, 0.05);
    }
    .sc-card-title {
      font-size: 16px;
      font-weight: 600;
      color: #5c4e33;
      border-bottom: 1px solid #e3dec3;
      padding-bottom: 8px;
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
      background-color: #fbf9f2;
      border: 1px solid #d4cca6;
      color: #5c4e33;
      padding: 10px;
      border-radius: 4px;
      cursor: pointer;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .sc-btn:hover {
      background-color: #e3dec3;
      border-color: #bfa36c;
    }
    .sc-btn-primary {
      background-color: #e4d7a8;
      border-color: #bfa36c;
    }
    .sc-btn-primary:hover {
      background-color: #d8c78c;
    }
    .sc-input, .sc-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d4cca6;
      background-color: #fdfdfb;
      border-radius: 4px;
      color: #3a352a;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .sc-input:focus, .sc-select:focus {
      outline: none;
      border-color: #a48235;
    }
    .sc-badge {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
      background-color: #e8e4cf;
      color: #5c4e33;
    }
    .sc-badge-concubine {
      background-color: #f5e2da;
      color: #a05335;
    }
    .sc-badge-official {
      background-color: #dae6f5;
      color: #355da0;
    }
    .sc-list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px dashed #e3dec3;
    }
    .sc-list-item:last-child {
      border-bottom: none;
    }
    /* 聊天对话框专用样式 */
    .sc-chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .sc-chat-history {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      background-color: #fcfbfa;
      border: 1px solid #e3dec3;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .sc-chat-msg {
      margin-bottom: 16px;
      line-height: 1.6;
    }
    .sc-chat-msg.narrative {
      color: #5c4e33;
      border-left: 2px solid #d4cca6;
      padding-left: 10px;
      font-style: normal;
    }
    .sc-chat-msg.user {
      text-align: right;
    }
    .sc-chat-msg.user .msg-content {
      display: inline-block;
      background-color: #ebdca5;
      color: #3a352a;
      padding: 8px 12px;
      border-radius: 6px;
      text-align: left;
      max-width: 80%;
    }
    .sc-chat-msg-sender {
      font-size: 12px;
      color: #7c725c;
      margin-bottom: 4px;
    }
    .sc-chat-input-area {
      display: flex;
      gap: 8px;
    }
    .sc-chat-input {
      flex: 1;
      padding: 10px;
      border: 1px solid #d4cca6;
      background-color: #fcfbfa;
      border-radius: 4px;
      font-size: 14px;
    }
    .sc-chat-input:focus {
      outline: none;
      border-color: #a48235;
    }
    /* 批奏折弹窗或全屏样式 */
    .sc-memorial-scroll {
      background-color: #fdfcf7;
      border: 1px solid #e2dab6;
      border-radius: 4px;
      padding: 24px;
      margin-bottom: 16px;
      font-family: serif;
      font-size: 15px;
      line-height: 1.8;
      letter-spacing: 1px;
      color: #2b261b;
      min-height: 150px;
    }
    .sc-dynasty-badge {
      display: inline-block;
      background-color: #e2d3a3;
      color: #413516;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      margin-left: 8px;
    }
  `;

  // 默认王朝配置和数据模板
  const DEFAULT_DYNASTY = {
    eraName: '大燕',
    year: '元',
    emperorMask: '未设置'
  };

  // 注册 Roche 插件
  window.RochePlugin.register({
    id: 'shangchao-plugin',
    name: '上朝！',
    version: '1.0.0',
    apps: [
      {
        id: 'shangchao-home',
        name: '上朝！',
        icon: 'extension',
        iconImage: '',

        async mount(container, roche) {
          // 插入专有样式
          if (!document.getElementById(STYLE_ID)) {
            const style = document.createElement('style');
            style.id = STYLE_ID;
            style.innerHTML = STYLES;
            document.head.appendChild(style);
          }

          // 初始化主结构
          container.innerHTML = `
            <div class="roche-plugin-shangchao">
              <div class="sc-header">
                <div class="sc-header-title" id="sc-app-title">上朝！</div>
                <button class="sc-header-btn" id="sc-btn-close">
                  ${ICONS.back} <span>退朝</span>
                </button>
              </div>
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

          // 初始化运行时变量
          let currentTab = 'home';
          let currentSubView = null; // 'draft', 'exam', 'background', 'memorials', 'harem', 'study', 'emperor', 'chat'
          let activeChatSessionId = null;

          // 本地缓存
          let listCharacters = [];
          let dynInfo = DEFAULT_DYNASTY;
          let gameData = {
            roles: {}, // charId -> { type: 'concubine'|'official', title: '', rank: '', background: '', npcs: [] }
            sessions: [], // { id, type: 'overnight'|'secret', charId, messages: [] }
            memorials: [] // { id, title, author, content, options: [] }
          };

          // 核心DOM选择器
          const viewContainer = container.querySelector('#sc-main-view');
          const appTitle = container.querySelector('#sc-app-title');

          // 统一保存方法
          const saveGameData = async () => {
            await roche.storage.set('game_data', gameData);
          };

          // 统一加载数据方法
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
              console.error('[上朝！] 加载本地数据出错', e);
            }
          };

          // 渲染主框架
          const render = () => {
            appTitle.innerHTML = `上朝！<span class="sc-dynasty-badge">【${esc(dynInfo.eraName)}】${esc(dynInfo.year)}年</span>`;

            if (currentSubView) {
              renderSubView();
            } else {
              renderTab();
            }
          };

          // 切换主要Tab
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

          // 渲染各大页签内容
          const renderTab = () => {
            if (currentTab === 'home') {
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">
                    <span>朝堂理政</span>
                    <button class="sc-header-btn" style="padding: 2px 6px; font-size:11px;" id="sc-btn-edit-emperor">${ICONS.edit} 圣颜/年号</button>
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
                    <button class="sc-btn" id="sc-nav-harem" style="border-color: #a05335; background-color: #faf3f0;">去后宫</button>
                    <button class="sc-btn" id="sc-nav-study" style="border-color: #355da0; background-color: #f0f3fa;">去御书房</button>
                  </div>
                </div>
              `;

              // 绑定主页路由事件
              container.querySelector('#sc-btn-edit-emperor').onclick = () => { currentSubView = 'emperor'; render(); };
              container.querySelector('#sc-nav-draft').onclick = () => { currentSubView = 'draft'; render(); };
              container.querySelector('#sc-nav-exam').onclick = () => { currentSubView = 'exam'; render(); };
              container.querySelector('#sc-nav-background').onclick = () => { currentSubView = 'background'; render(); };
              container.querySelector('#sc-nav-memorials').onclick = () => { currentSubView = 'memorials'; render(); };
              container.querySelector('#sc-nav-harem').onclick = () => { currentSubView = 'harem'; render(); };
              container.querySelector('#sc-nav-study').onclick = () => { currentSubView = 'study'; render(); };

            } else if (currentTab === 'sessions') {
              // 续约列表
              const sList = gameData.sessions || [];
              if (sList.length === 0) {
                viewContainer.innerHTML = `
                  <div style="text-align:center; padding: 40px 10px; color: #7c725c; font-size: 14px;">
                    四海升平，暂无正在进行中的留宿与密谈。
                  </div>
                `;
                return;
              }

              let html = `<div class="sc-card"><div class="sc-card-title">进行中的留宿与密谈</div>`;
              sList.forEach((s) => {
                const char = listCharacters.find(c => c.id === s.charId);
                const name = char ? (char.handle || char.name) : '未知角色';
                const role = gameData.roles[s.charId] || {};
                const titleText = role.title ? `【${role.title}】` : '';
                const typeText = s.type === 'overnight' ? '后宫留宿' : '御书房密谈';

                html += `
                  <div class="sc-list-item">
                    <div>
                      <div style="font-weight: bold; color: #5c4e33;">${esc(name)} ${esc(titleText)}</div>
                      <div style="font-size: 12px; color: #7c725c; margin-top:4px;">${esc(typeText)}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                      <button class="sc-btn" style="padding: 4px 8px; font-size: 12px;" id="sc-btn-resume-${s.id}">继续</button>
                      <button class="sc-btn" style="padding: 4px 8px; font-size: 12px; border-color: #d15c5c; color: #d15c5c;" id="sc-btn-del-sess-${s.id}">删除</button>
                    </div>
                  </div>
                `;
              });
              html += '</div>';
              viewContainer.innerHTML = html;

              // 绑定事件
              sList.forEach((s) => {
                container.querySelector(`#sc-btn-resume-${s.id}`).onclick = () => {
                  activeChatSessionId = s.id;
                  currentSubView = 'chat';
                  render();
                };
                container.querySelector(`#sc-btn-del-sess-${s.id}`).onclick = async () => {
                  const confirm = await roche.ui.confirm({
                    title: '确认清退',
                    message: '确定要结束并删除此段对话记录吗？'
                  });
                  if (confirm) {
                    gameData.sessions = gameData.sessions.filter(sess => sess.id !== s.id);
                    await saveGameData();
                    renderTab();
                  }
                };
              });

            } else if (currentTab === 'archives') {
              // 卷宗列表
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">大燕实录与卷宗</div>
                  <div id="sc-archives-list"></div>
                </div>
              `;
              const listDiv = container.querySelector('#sc-archives-list');
              if (listCharacters.length === 0) {
                listDiv.innerHTML = `<div style="text-align:center; padding: 20px 0; color: #7c725c;">暂未在宿主中找到任何角色。</div>`;
                return;
              }

              let html = '';
              listCharacters.forEach(c => {
                const role = gameData.roles[c.id] || { type: 'none', title: '庶民', rank: '' };
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

                html += `
                  <div style="padding: 12px 0; border-bottom: 1px solid #e3dec3;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-weight: bold; font-size:15px; color: #4e442f;">${esc(c.handle || c.name)}</span>
                      <span class="sc-badge ${badgeClass}">${esc(badgeText)} - ${esc(role.title || '无')} ${esc(role.rank ? role.rank + '品' : '')}</span>
                    </div>
                    <div style="font-size: 13px; color: #7c725c; margin-top: 6px; background-color: #fcfbfa; padding: 6px; border: 1px dashed #e3dec3; border-radius: 4px;">
                      <div><strong>家世：</strong>${esc(bg)}</div>
                      <div style="margin-top: 4px;">
                        <strong>亲眷戚党 (${npcs.length}/5)：</strong>
                        ${npcs.length === 0 ? '暂无' : npcs.map(n => `${esc(n.name)}(${esc(n.relation)}: ${esc(n.bio)})`).join('；')}
                      </div>
                    </div>
                    <div style="margin-top: 8px; text-align: right;">
                      <button class="sc-btn" style="padding: 4px 8px; font-size:11px;" id="sc-btn-edit-arch-${c.id}">编辑档案</button>
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

          // 编辑档案弹窗式处理 (SPA子页面)
          const openEditArchiveModal = (charId) => {
            const char = listCharacters.find(c => c.id === charId);
            const role = gameData.roles[charId] || { type: 'none', title: '', rank: '', background: '', npcs: [] };

            viewContainer.innerHTML = `
              <div class="sc-card">
                <div class="sc-card-title">编辑卷宗：${esc(char.handle || char.name)}</div>
                
                <label style="font-size:12px; color:#7c725c;">类型</label>
                <select class="sc-select" id="sc-edit-type">
                  <option value="none" ${role.type === 'none' ? 'selected' : ''}>平民</option>
                  <option value="concubine" ${role.type === 'concubine' ? 'selected' : ''}>妃嫔 (后宫)</option>
                  <option value="official" ${role.type === 'official' ? 'selected' : ''}>朝臣 (御书房)</option>
                </select>

                <label style="font-size:12px; color:#7c725c;">封号 / 官职</label>
                <input class="sc-input" type="text" id="sc-edit-title" value="${esc(role.title)}">

                <label style="font-size:12px; color:#7c725c;">品级 (1至9品)</label>
                <input class="sc-input" type="text" id="sc-edit-rank" value="${esc(role.rank)}">

                <label style="font-size:12px; color:#7c725c;">家世背景</label>
                <textarea class="sc-input" style="height: 60px; resize: none;" id="sc-edit-bg">${esc(role.background)}</textarea>

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
              const type = container.querySelector('#sc-edit-type').value;
              const title = container.querySelector('#sc-edit-title').value;
              const rank = container.querySelector('#sc-edit-rank').value;
              const background = container.querySelector('#sc-edit-bg').value;

              gameData.roles[charId] = {
                ...role,
                type,
                title,
                rank,
                background
              };
              await saveGameData();
              roche.ui.toast('档案更新成功');
              renderTab();
            };
          };

          // 渲染二层子界面
          const renderSubView = () => {
            if (currentSubView === 'emperor') {
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">圣颜与年号</div>
                  
                  <label style="font-size:12px; color:#7c725c;">王朝名 / 帝国名</label>
                  <input class="sc-input" type="text" id="sc-set-dynasty" value="${esc(dynInfo.eraName)}">

                  <label style="font-size:12px; color:#7c725c;">当前年号 (如：贞观、庆历)</label>
                  <input class="sc-input" type="text" id="sc-set-year" value="${esc(dynInfo.year)}">

                  <div style="display:flex; gap:12px; margin-top:12px;">
                    <button class="sc-btn" style="flex:1;" id="sc-set-back">返回</button>
                    <button class="sc-btn sc-btn-primary" style="flex:1;" id="sc-set-save">确立大统</button>
                  </div>
                </div>
              `;

              container.querySelector('#sc-set-back').onclick = () => { currentSubView = null; render(); };
              container.querySelector('#sc-set-save').onclick = async () => {
                dynInfo.eraName = container.querySelector('#sc-set-dynasty').value;
                dynInfo.year = container.querySelector('#sc-set-year').value;
                await roche.storage.set('dynasty_info', dynInfo);
                roche.ui.toast('受命于天，既寿永昌。年号修改完成。');
                currentSubView = null;
                render();
              };

            } else if (currentSubView === 'draft') {
              // 选秀大典
              let charOptions = listCharacters.map(c => `<option value="${c.id}">${esc(c.handle || c.name)}</option>`).join('');
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">选秀大典</div>
                  <label style="font-size:12px; color:#7c725c;">选择参与选秀的秀女</label>
                  <select class="sc-select" id="sc-draft-char">${charOptions}</select>
                  
                  <button class="sc-btn sc-btn-primary" style="width:100%; margin-bottom:12px;" id="sc-btn-draft-speak">命其自陈陈情</button>
                  
                  <div id="sc-draft-speech" class="sc-memorial-scroll" style="display:none; font-size:14px;">自陈中...</div>

                  <div id="sc-draft-assign" style="display:none;">
                    <label style="font-size:12px; color:#7c725c;">拟定封号 (如：宸妃、常在、贵人)</label>
                    <input class="sc-input" type="text" id="sc-draft-title" placeholder="如：丽人">
                    
                    <label style="font-size:12px; color:#7c725c;">品级 (九至一品，一品最高)</label>
                    <input class="sc-input" type="text" id="sc-draft-rank" placeholder="如：正五品">

                    <button class="sc-btn sc-btn-primary" style="width:100%;" id="sc-btn-draft-confirm">纳入后宫</button>
                  </div>

                  <button class="sc-btn" style="width:100%; margin-top:12px;" id="sc-draft-back">返回朝堂</button>
                </div>
              `;

              const speechBox = container.querySelector('#sc-draft-speech');
              const assignBox = container.querySelector('#sc-draft-assign');

              container.querySelector('#sc-draft-back').onclick = () => { currentSubView = null; render(); };
              container.querySelector('#sc-btn-draft-speak').onclick = async () => {
                const charId = container.querySelector('#sc-draft-char').value;
                const char = listCharacters.find(c => c.id === charId);
                if (!char) return;

                speechBox.style.display = 'block';
                speechBox.innerText = '秀女款步上前，正欲开言自陈...';
                assignBox.style.display = 'none';

                try {
                  const prompt = `你是角色【${char.name}】，昵称是【${char.handle || ''}】。在当前的《上朝！》帝王扮演场景中，你正站在秀女大典的殿前。请你结合你的人设和性格，用一段优雅古典、不带任何emoji的陈情自白，向皇帝（用户）展现自己并争取被选入后宫。`;
                  const res = await roche.ai.chat({
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.8
                  });
                  speechBox.innerHTML = esc(res.text);
                  assignBox.style.display = 'block';
                } catch (e) {
                  speechBox.innerText = '秀女深鞠一躬，殿前嘈杂，无法听清。请确认AI服务配置是否正常。';
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
                roche.ui.toast(`已降旨：册封 ${title}，迁入后宫。`);
                currentSubView = null;
                render();
              };

            } else if (currentSubView === 'exam') {
              // 科考殿试
              let charOptions = listCharacters.map(c => `<option value="${c.id}">${esc(c.handle || c.name)}</option>`).join('');
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">科考殿试</div>
                  <label style="font-size:12px; color:#7c725c;">传召考生</label>
                  <select class="sc-select" id="sc-exam-char">${charOptions}</select>
                  
                  <label style="font-size:12px; color:#7c725c;">拟殿试策论题目</label>
                  <input class="sc-input" type="text" id="sc-exam-question" value="为君者当如何平准米粮，以绝奸商囤积？">

                  <button class="sc-btn sc-btn-primary" style="width:100%; margin-bottom:12px;" id="sc-btn-exam-run">命其破题解答</button>

                  <div id="sc-exam-result" class="sc-memorial-scroll" style="display:none; font-size:14px;">正在阅卷中...</div>

                  <div id="sc-exam-assign" style="display:none;">
                    <label style="font-size:12px; color:#7c725c;">授官官职 (如：翰林学士、中书侍郎、御史大夫)</label>
                    <input class="sc-input" type="text" id="sc-exam-title" placeholder="如：修撰">
                    
                    <label style="font-size:12px; color:#7c725c;">授官品级</label>
                    <input class="sc-input" type="text" id="sc-exam-rank" placeholder="如：从六品">

                    <button class="sc-btn sc-btn-primary" style="width:100%;" id="sc-btn-exam-confirm">钦点进士，委以重任</button>
                  </div>

                  <button class="sc-btn" style="width:100%; margin-top:12px;" id="sc-exam-back">返回朝堂</button>
                </div>
              `;

              const resBox = container.querySelector('#sc-exam-result');
              const assignBox = container.querySelector('#sc-exam-assign');

              container.querySelector('#sc-exam-back').onclick = () => { currentSubView = null; render(); };
              container.querySelector('#sc-btn-exam-run').onclick = async () => {
                const charId = container.querySelector('#sc-exam-char').value;
                const question = container.querySelector('#sc-exam-question').value;
                const char = listCharacters.find(c => c.id === charId);
                if (!char) return;

                resBox.style.display = 'block';
                resBox.innerText = '研磨拂纸，提笔挥毫中...';
                assignBox.style.display = 'none';

                try {
                  const prompt = `你是考生【${char.name}】，在当前的《上朝！》科考殿试中。面对圣上御笔亲提之殿试题目：“${question}”。请结合你的人设学识，写一篇字数约200字，古典而有你鲜明个人特质的策论答卷。不要包含任何表情符号 (emoji)。`;
                  const res = await roche.ai.chat({
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                  });
                  resBox.innerHTML = esc(res.text);
                  assignBox.style.display = 'block';
                } catch (e) {
                  resBox.innerText = '考生惶恐无措，汗流浃背。请确认AI配置。';
                }
              };

              container.querySelector('#sc-btn-exam-confirm').onclick = async () => {
                const charId = container.querySelector('#sc-exam-char').value;
                const title = container.querySelector('#sc-exam-title').value || '翰林';
                const rank = container.querySelector('#sc-exam-rank').value || '六品';

                if (!gameData.roles[charId]) {
                  gameData.roles[charId] = { type: 'none', title: '', rank: '', background: '', npcs: [] };
                }
                gameData.roles[charId].type = 'official';
                gameData.roles[charId].title = title;
                gameData.roles[charId].rank = rank;

                await saveGameData();
                roche.ui.toast(`已拟定官制：授 ${title} 一职，即日赴任。`);
                currentSubView = null;
                render();
              };

            } else if (currentSubView === 'background') {
              // 一键身边人背景生成
              let charOptions = listCharacters.map(c => `<option value="${c.id}">${esc(c.handle || c.name)}</option>`).join('');
              viewContainer.innerHTML = `
                <div class="sc-card">
                  <div class="sc-card-title">一键家世与戚党生成</div>
                  <label style="font-size:12px; color:#7c725c;">选择角色</label>
                  <select class="sc-select" id="sc-bg-char">${charOptions}</select>

                  <button class="sc-btn sc-btn-primary" style="width:100%; margin-bottom:12px;" id="sc-btn-bg-run">生成家世亲党</button>

                  <div id="sc-bg-result" class="sc-memorial-scroll" style="display:none; font-size:13px;">通读典章家族图谱中...</div>

                  <button class="sc-btn" style="width:100%;" id="sc-bg-back">返回朝堂</button>
                </div>
              `;

              const resBox = container.querySelector('#sc-bg-result');
              container.querySelector('#sc-bg-back').onclick = () => { currentSubView = null; render(); };
              container.querySelector('#sc-btn-bg-run').onclick = async () => {
                const charId = container.querySelector('#sc-bg-char').value;
                const char = listCharacters.find(c => c.id === charId);
                if (!char) return;

                resBox.style.display = 'block';
                resBox.innerText = '文官提笔翻阅家族卷宗，探明来龙去脉中...';

                try {
                  const prompt = `你是一个古代家世背景设定生成器。请根据大燕王朝的社会背景，为角色【${char.name}】（人设描述：${char.persona || char.bio || '普通世家'}）生成一份不超过五个NPC的身边人（亲眷、戚党、门客）列表，并明确说明他的家世。
                    必须使用严格的JSON结构，不要输出任何其他的markdown格式或特殊包裹，也不要包含任何emoji。
                    
                    格式示例：
                    {
                      "background": "出身于江南望族，父辈世袭定国公...",
                      "npcs": [
                        {"name": "沈老太爷", "relation": "祖父", "bio": "曾任内阁首辅，声望极高。"},
                        {"name": "沈令仪", "relation": "长姐", "bio": "外柔内刚，善掌商路。"}
                      ]
                    }`;

                  const res = await roche.ai.chat({
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.8
                  });

                  // 解析生成结果并保存
                  let parsed = {};
                  try {
                    // 去除可能的 markdown 代码块标识
                    let cleanedText = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
                    parsed = JSON.parse(cleanedText);
                  } catch (e) {
                    console.error('JSON解析失败，尝试兼容性兜底正则匹配', e);
                    parsed = {
                      background: res.text.substring(0, 150) + '...',
                      npcs: []
                    };
                  }

                  if (!gameData.roles[charId]) {
                    gameData.roles[charId] = { type: 'none', title: '', rank: '', background: '', npcs: [] };
                  }
                  gameData.roles[charId].background = parsed.background || '家世清白';
                  gameData.roles[charId].npcs = (parsed.npcs || []).slice(0, 5);

                  await saveGameData();

                  let html = `<strong>家世设定：</strong><br>${esc(gameData.roles[charId].background)}<br><br><strong>戚党亲眷：</strong><br>`;
                  gameData.roles[charId].npcs.forEach((n, idx) => {
                    html += `${idx + 1}. ${esc(n.name)} (${esc(n.relation)}) - ${esc(n.bio)}<br>`;
                  });

                  resBox.innerHTML = html;
                } catch (err) {
                  resBox.innerText = '卷宗残破不全，未能查清。请重试。';
                }
              };

            } else if (currentSubView === 'memorials') {
              // 批阅奏折
              const mList = gameData.memorials || [];

              const renderMemorialCard = () => {
                if (mList.length === 0) {
                  viewContainer.innerHTML = `
                    <div class="sc-card">
                      <div class="sc-card-title">批阅奏折</div>
                      <div style="text-align:center; padding:30px 0; color:#7c725c;">司礼监传报：今日通政司无积压奏疏。</div>
                      <button class="sc-btn sc-btn-primary" style="width:100%; margin-bottom:12px;" id="sc-btn-gen-memo">传呈新折子</button>
                      <button class="sc-btn" style="width:100%;" id="sc-memo-back">返回朝堂</button>
                    </div>
                  `;

                  container.querySelector('#sc-memo-back').onclick = () => { currentSubView = null; render(); };
                  container.querySelector('#sc-btn-gen-memo').onclick = async () => {
                    await generateNewMemorial();
                  };
                  return;
                }

                const currentMemo = mList[0];
                viewContainer.innerHTML = `
                  <div class="sc-card">
                    <div class="sc-card-title">通政司题本</div>
                    <div class="sc-memorial-scroll">
                      <strong style="font-size: 16px;">《${esc(currentMemo.title)}》</strong><br>
                      <span style="font-size:12px; color:#7c725c; display:block; margin: 6px 0 12px 0;">呈递人：${esc(currentMemo.author)}</span>
                      <p style="white-space: pre-wrap; margin:0;">${esc(currentMemo.content)}</p>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:8px;">
                      ${(currentMemo.options || []).map((opt, i) => `
                        <button class="sc-btn" id="sc-btn-memo-opt-${i}">${esc(opt.text)}</button>
                      `).join('')}
                    </div>

                    <button class="sc-btn" style="width:100%; margin-top:16px;" id="sc-memo-back">返回朝堂</button>
                  </div>
                `;

                container.querySelector('#sc-memo-back').onclick = () => { currentSubView = null; render(); };
                currentMemo.options.forEach((opt, i) => {
                  container.querySelector(`#sc-btn-memo-opt-${i}`).onclick = async () => {
                    roche.ui.toast(`已裁定：${opt.text}。${opt.effect}`);
                    gameData.memorials.shift(); // 移除首个处理过的奏折
                    await saveGameData();
                    renderMemorialCard();
                  };
                });
              };

              // 自动生成一份折子
              const generateNewMemorial = async () => {
                roche.ui.toast('御笔亲批，传旨拟折中...');
                try {
                  // 获取当前的角色环境，增加写实度
                  let officials = Object.entries(gameData.roles)
                    .filter(([_, r]) => r.type === 'official')
                    .map(([id, _]) => listCharacters.find(c => c.id === id))
                    .filter(Boolean)
                    .map(c => c.handle || c.name);

                  let concubines = Object.entries(gameData.roles)
                    .filter(([_, r]) => r.type === 'concubine')
                    .map(([id, _]) => listCharacters.find(c => c.id === id))
                    .filter(Boolean)
                    .map(c => c.handle || c.name);

                  const prompt = `你现在是一位通政司的书吏。请根据大燕王朝的社会实情，拟写一份呈递给皇帝的奏折，可以是臣子（或后宫戚党）的弹劾、求恩、兵祸求援、或者地方水患陈情。
                    请多结合已有的臣子人物：【${officials.join(', ') || '朝中重臣'}】、或已入宫的妃嫔：【${concubines.join(', ') || '后宫嫔妃'}】，增加权力斗争色彩。
                    请严格返回JSON结构，不要包含任何emoji或任何其他的markdown包裹，如下示例：
                    {
                      "title": "请饷以固北疆疏",
                      "author": "蓟辽总督 李崇文",
                      "content": "伏以虏寇窥兵北疆，边防日急。臣统兵扼守关口，唯军食艰缺，将士衣褐不完。请拨内库银十万两，以固军心...",
                      "options": [
                        { "text": "准奏，发内帑十万两", "effect": "军威大振，但北疆将领做大。" },
                        { "text": "暂缓，令其就地筹措", "effect": "蓟辽军心不稳，恐生哗变。" }
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
                    title: parsed.title || '无标题题本',
                    author: parsed.author || '臣工无名',
                    content: parsed.content || '空疏无物。',
                    options: parsed.options || [{ text: '阅。', effect: '无影响。' }]
                  });

                  await saveGameData();
                  renderMemorialCard();
                } catch (e) {
                  roche.ui.toast('翰林笔枯，未能拟出合理奏章，请重新调取。');
                }
              };

              renderMemorialCard();

            } else if (currentSubView === 'harem') {
              // 后宫一览与召见
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
                    <div class="sc-card-title">六宫后妃</div>
                    <div style="text-align:center; padding: 40px 10px; color:#7c725c;">
                      六宫粉黛，尚无人被选秀纳入。
                    </div>
                    <button class="sc-btn" style="width:100%; margin-top:12px;" id="sc-harem-back">返回朝堂</button>
                  </div>
                `;
                container.querySelector('#sc-harem-back').onclick = () => { currentSubView = null; render(); };
                return;
              }

              let html = `<div class="sc-card"><div class="sc-card-title">大燕后宫</div>`;
              haremList.forEach(item => {
                const charName = item.char.handle || item.char.name;
                html += `
                  <div class="sc-list-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <strong>${esc(charName)}</strong>
                        <span style="font-size:12px; color:#7c725c; margin-left:8px;">【${esc(item.title)}】 (${esc(item.rank ? item.rank + '品' : '无')})</span>
                      </div>
                      <div style="font-size:11px; color: #a05335;">身处：兰林殿</div>
                    </div>
                    <div style="display:flex; gap: 8px;">
                      <button class="sc-btn" style="padding:4px 8px; font-size:12px;" id="sc-btn-harem-promote-${item.char.id}">升位</button>
                      <button class="sc-btn" style="padding:4px 8px; font-size:12px;" id="sc-btn-harem-demote-${item.char.id}">降位</button>
                      <button class="sc-btn sc-btn-primary" style="padding:4px 12px; font-size:12px;" id="sc-btn-harem-stay-${item.char.id}">召见留宿</button>
                    </div>
                  </div>
                `;
              });
              html += `<button class="sc-btn" style="width:100%; margin-top:12px;" id="sc-harem-back">返回朝堂</button></div>`;

              viewContainer.innerHTML = html;
              container.querySelector('#sc-harem-back').onclick = () => { currentSubView = null; render(); };

              haremList.forEach(item => {
                const cid = item.char.id;

                container.querySelector(`#sc-btn-harem-promote-${cid}`).onclick = async () => {
                  const newTitle = await promptInputText('晋升妃嫔', '请输入册封新封号（如：贵妃、昭仪）');
                  if (newTitle) {
                    gameData.roles[cid].title = newTitle;
                    await saveGameData();
                    roche.ui.toast(`已晋封 ${esc(item.char.handle || item.char.name)} 为：${esc(newTitle)}。`);
                    renderSubView();
                  }
                };

                container.querySelector(`#sc-btn-harem-demote-${cid}`).onclick = async () => {
                  const newTitle = await promptInputText('降等责罚', '请输入褫夺或贬低之封号（如：答应、常在）');
                  if (newTitle) {
                    gameData.roles[cid].title = newTitle;
                    await saveGameData();
                    roche.ui.toast(`已降谪 ${esc(item.char.handle || item.char.name)} 为：${esc(newTitle)}。`);
                    renderSubView();
                  }
                };

                container.querySelector(`#sc-btn-harem-stay-${cid}`).onclick = async () => {
                  // 创建新的留宿回话
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
              // 御书房一览与密谈
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
                    <div class="sc-card-title">御书房召见</div>
                    <div style="text-align:center; padding: 40px 10px; color:#7c725c;">
                      乾纲独断，朝中尚无钦点之大臣。
                    </div>
                    <button class="sc-btn" style="width:100%; margin-top:12px;" id="sc-study-back">返回朝堂</button>
                  </div>
                `;
                container.querySelector('#sc-study-back').onclick = () => { currentSubView = null; render(); };
                return;
              }

              let html = `<div class="sc-card"><div class="sc-card-title">御前议政</div>`;
              officialList.forEach(item => {
                const charName = item.char.handle || item.char.name;
                html += `
                  <div class="sc-list-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <strong>${esc(charName)}</strong>
                        <span style="font-size:12px; color:#7c725c; margin-left:8px;">【${esc(item.title)}】 (${esc(item.rank ? item.rank + '品' : '无')})</span>
                      </div>
                      <div style="font-size:11px; color:#355da0;">衙署：翰林院</div>
                    </div>
                    <div style="display:flex; gap: 8px;">
                      <button class="sc-btn" style="padding:4px 8px; font-size:12px;" id="sc-btn-study-promote-${item.char.id}">晋升</button>
                      <button class="sc-btn" style="padding:4px 8px; font-size:12px;" id="sc-btn-study-demote-${item.char.id}">贬谪</button>
                      <button class="sc-btn sc-btn-primary" style="padding:4px 12px; font-size:12px;" id="sc-btn-study-chat-${item.char.id}">传召密谈</button>
                    </div>
                  </div>
                `;
              });
              html += `<button class="sc-btn" style="width:100%; margin-top:12px;" id="sc-study-back">返回朝堂</button></div>`;

              viewContainer.innerHTML = html;
              container.querySelector('#sc-study-back').onclick = () => { currentSubView = null; render(); };

              officialList.forEach(item => {
                const cid = item.char.id;

                container.querySelector(`#sc-btn-study-promote-${cid}`).onclick = async () => {
                  const newTitle = await promptInputText('官职高升', '请输入晋封新官职（如：尚书、大学士）');
                  if (newTitle) {
                    gameData.roles[cid].title = newTitle;
                    await saveGameData();
                    roche.ui.toast(`已降旨晋升 ${esc(item.char.handle || item.char.name)} 为：${esc(newTitle)}。`);
                    renderSubView();
                  }
                };

                container.querySelector(`#sc-btn-study-demote-${cid}`).onclick = async () => {
                  const newTitle = await promptInputText('官衔罢黜', '请输入降授新官职（如：主事、知县、庶吉士）');
                  if (newTitle) {
                    gameData.roles[cid].title = newTitle;
                    await saveGameData();
                    roche.ui.toast(`已降免 ${esc(item.char.handle || item.char.name)} 职，责授为：${esc(newTitle)}。`);
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
              // 线下长叙事回合对话页面 (留宿/密谈)
              const session = gameData.sessions.find(s => s.id === activeChatSessionId);
              if (!session) {
                currentSubView = null;
                render();
                return;
              }

              const char = listCharacters.find(c => c.id === session.charId);
              const name = char ? (char.handle || char.name) : '未知角色';
              const role = gameData.roles[session.charId] || {};
              const typeText = session.type === 'overnight' ? '后宫留宿' : '御书房密谈';

              viewContainer.innerHTML = `
                <div class="sc-chat-container">
                  <div class="sc-chat-history" id="sc-chat-msg-box"></div>
                  <div class="sc-chat-input-area">
                    <input class="sc-chat-input" id="sc-chat-input-dom" placeholder="输入帝王的裁断或问话..." />
                    <button class="sc-btn sc-btn-primary" id="sc-btn-chat-send" style="padding:10px 16px;">垂问</button>
                  </div>
                  <button class="sc-btn" style="width:100%; margin-top:12px;" id="sc-chat-back">退下</button>
                </div>
              `;

              const msgBox = container.querySelector('#sc-chat-msg-box');
              const inputDom = container.querySelector('#sc-chat-input-dom');

              container.querySelector('#sc-chat-back').onclick = () => {
                currentSubView = null;
                render();
              };

              // 绘制对话历史
              const renderChatHistory = () => {
                if (session.messages.length === 0) {
                  msgBox.innerHTML = `
                    <div class="sc-chat-msg narrative">
                      系统白描：圣驾临幸，更漏渐深。四下静寂，【${esc(name)}】恭谨侍立，候旨裁决。
                    </div>
                  `;
                  return;
                }

                let html = '';
                session.messages.forEach(m => {
                  if (m.role === 'user') {
                    html += `
                      <div class="sc-chat-msg user">
                        <div class="sc-chat-msg-sender">万岁爷</div>
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

                // 调用 AI 生成古典白描风格回复
                const systemPrompt = `你正在协助用户演绎大燕王朝帝王的模拟互动。
                  当前场景设定：${session.type === 'overnight' ? '后宫留宿（帝王临幸，深夜长叙）' : '御书房密谈（重臣密奏，极密议政）'}。
                  互动人物：【${char.name}】（封号官职：【${role.title || '无'}】，品级：【${role.rank || '无'}】）。
                  家世背景：【${role.background || '无详细记录'}】。
                  
                  【核心文风规约】：
                  1. 必须使用精炼、含蓄的“第三人称白描手法”来叙述【${char.name}】的语言、举止和神态。
                  2. 坚决不要包含任何表情符号（emoji）。
                  3. 皇帝（用户）处于绝对统治地位，回复中必须使用第二人称“您”或“陛下”来称呼皇帝。
                  4. 单次剧情和言词回复控制在 100 至 200 字之间，务必营造沉浸感、古典氛围感、心理刻画细腻生动。`;

                // 准备对话链
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
                  session.messages.push({ role: 'assistant', text: '系统白描：烛火忽而飘摇，侍从惶恐趋前。圣上御言未能通达，或因内务府配置未妥，还望改日再叙。' });
                  await saveGameData();
                  renderChatHistory();
                }
              };

              container.querySelector('#sc-btn-chat-send').onclick = sendChatMessage;
              inputDom.onkeydown = (e) => { if (e.key === 'Enter') sendChatMessage(); };

              renderChatHistory();
            }
          };

          // 通用的简易文字输入弹窗逻辑
          const promptInputText = (title, message) => {
            return new Promise((resolve) => {
              // 为了避免影响其他框架，我们纯前端动态生成一个简易输入框遮罩层
              const mask = document.createElement('div');
              mask.style.cssText = `
                position: absolute; top:0; left:0; right:0; bottom:0;
                background-color: rgba(58, 53, 42, 0.4);
                display: flex; align-items: center; justify-content: center;
                z-index: 1000; padding: 20px;
              `;

              mask.innerHTML = `
                <div class="sc-card" style="width:100%; max-width: 320px; background-color:#fcfbfa; border: 2px solid #bfa36c;">
                  <div class="sc-card-title">${esc(title)}</div>
                  <div style="font-size:12px; color:#7c725c; margin-bottom: 8px;">${esc(message)}</div>
                  <input class="sc-input" type="text" id="sc-modal-input-val" style="margin-bottom: 12px;">
                  <div style="display:flex; gap: 8px;">
                    <button class="sc-btn" style="flex:1;" id="sc-modal-cancel">放弃</button>
                    <button class="sc-btn sc-btn-primary" style="flex:1;" id="sc-modal-ok">传旨</button>
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

          // 装载流程
          await loadAllData();

          // 绑定导航底栏
          container.querySelectorAll('.sc-dock-item').forEach(btn => {
            btn.onclick = () => {
              switchTab(btn.getAttribute('data-tab'));
            };
          });

          container.querySelector('#sc-btn-close').onclick = () => {
            roche.ui.closeApp();
          };

          // 首次默认绘制首页
          render();
        },

        async unmount(container, roche) {
          // 清理样式
          const style = document.getElementById(STYLE_ID);
          if (style) {
            style.remove();
          }
          // 清空子DOM与解绑事件
          container.replaceChildren();
        }
      }
    ]
  });
})();