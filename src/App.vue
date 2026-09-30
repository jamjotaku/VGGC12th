<template>
<div class="font-sans bg-gray-50 text-gray-900 min-h-screen flex flex-col pt-14 pb-20 md:pb-0">

    
    <!-- ナビゲーションバー -->
    <nav class="bg-white shadow-sm border-b px-3 md:px-4 py-2 md:py-3 flex justify-between items-center z-20 flex-shrink-0">
      <div class="font-bold text-base md:text-lg flex items-center gap-2">
        VGGC 12th 
        <span v-if="isReadOnly" class="text-[10px] md:text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">閲覧専用</span>
      </div>
      <div class="flex items-center gap-2 md:gap-3">
        <!-- ヘルプボタン -->
        <button @click="showHelpModal = true" class="p-1 md:p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition" title="ヘルプ・免責事項">
          <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>

        <button v-if="isReadOnly" @click="exitReadOnly" class="text-xs md:text-sm bg-gray-800 text-white px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-700 transition">
          <span class="hidden md:inline">自分のリストへ戻る</span>
          <span class="md:hidden">戻る</span>
        </button>
        
        <template v-if="!user && !isReadOnly">
          <button @click="showAuthModal = true" class="text-xs md:text-sm bg-blue-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
            <span class="hidden sm:inline">ログイン / 同期</span>
            <span class="sm:hidden">ログイン</span>
          </button>
        </template>
        
        <template v-if="user && !isReadOnly">
          <div class="flex items-center gap-1.5 md:gap-3">
            <div class="flex items-center gap-1 bg-gray-50 border border-gray-100 px-1.5 md:px-2 py-1 rounded-md">
              <span class="text-[10px] md:text-xs font-bold text-gray-600 max-w-[60px] md:max-w-[100px] truncate">{{ user.email.split('@')[0] }}</span>
              <span v-if="!isOnline" class="text-[10px] text-red-500 font-bold px-0.5" title="圏外（データは端末内に保存されています）">圏外</span>
              <template v-else>
                <span v-if="isSaving" class="text-[10px] text-gray-400" title="保存中">
                  <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                </span>
                <span v-else class="text-[10px] text-green-500" title="保存完了">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                </span>
              </template>
            </div>
            <button @click="showShareModal = true" class="text-xs md:text-sm bg-pink-50 text-pink-600 border border-pink-200 p-1.5 md:px-3 md:py-1.5 rounded-lg hover:bg-pink-100 transition flex items-center gap-1 font-bold" title="共有">
              <svg class="h-4 w-4 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              <span class="hidden md:inline">共有</span>
            </button>
            <button @click="signOut" class="text-gray-500 hover:text-gray-800 p-1.5 md:p-0 transition flex items-center gap-1" title="ログアウト">
              <svg class="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              <span class="text-xs underline hidden md:block">ログアウト</span>
            </button>
          </div>
        </template>
      </div>
    </nav>

    <!-- メインレイアウト -->
    <div class="flex-1 flex overflow-hidden bg-gray-100">
      
      <!-- =========================================
           左側：マップエリア (PC専用)
      ========================================== -->
      <div class="hidden md:flex w-5/12 lg:w-1/2 flex-col bg-white border-r shadow-sm overflow-y-auto relative">
        <div class="p-6 space-y-6">
          <div class="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div class="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
              <h2 class="text-lg font-bold text-gray-800">イベント概要</h2>
              <div class="text-sm text-gray-600 font-bold bg-white px-3 py-1 rounded-full shadow-sm">11/14(土) @ TRC第一展示場</div>
            </div>
            <ul class="text-sm space-y-3">
              <li class="flex items-start"><span class="w-16 font-bold text-gray-800 shrink-0">9:45-</span><span class="text-gray-700">一般参加者受付開始</span></li>
              <li class="flex items-start"><span class="w-16 font-bold text-gray-800 shrink-0">10:00-</span><span class="text-gray-700">サークル入場 (11:40迄) / 更衣室</span></li>
              <li class="flex items-start"><span class="w-16 font-bold text-blue-600 shrink-0">12:00</span><span class="text-blue-700 font-bold">即売会開始</span></li>
              <li class="flex items-start"><span class="w-16 font-bold text-red-500 shrink-0">15:30</span><span class="text-red-600 font-bold">即売会終了</span></li>
            </ul>
          </div>

          <div>
            <div class="flex justify-between items-end mb-2">
              <h1 class="text-xl font-bold text-gray-800">会場マップ</h1>
              <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">📍ピンをドラッグして現在地をメモ</span>
            </div>
            <!-- PC用マップコンテナ -->
            <div class="map-container shadow-inner relative">
              <div v-if="targetSpace" class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm z-30 flex items-center gap-2">
                📍 {{ targetSpace }} を探す
                <button @click="targetSpace = null" class="ml-2 bg-blue-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-blue-800 transition">×</button>
              </div>
              <div class="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
                <button @click="mapScale = Math.min(mapScale + 0.3, 2.5)" class="w-10 h-10 bg-white/90 shadow-lg rounded-full flex items-center justify-center text-gray-700 font-bold border border-gray-200 active:bg-gray-100 hover:bg-gray-50 transition" title="拡大">＋</button>
                <button @click="mapScale = Math.max(mapScale - 0.3, 0.4)" class="w-10 h-10 bg-white/90 shadow-lg rounded-full flex items-center justify-center text-gray-700 font-bold border border-gray-200 active:bg-gray-100 hover:bg-gray-50 transition" title="縮小">－</button>
              </div>
              <div class="map-inner" @touchmove="dragPin" @mousemove="dragPin" @mouseup="stopDrag" @mouseleave="stopDrag" @touchend="stopDrag">
                <img src="/map.jpg" alt="会場マップ" class="map-image" loading="lazy" :style="{ width: (900 * mapScale) + 'px' }">
                <svg class="draggable-pin text-red-600" viewBox="0 0 24 24" fill="currentColor" :style="{ left: (pinX * mapScale) + 'px', top: (pinY * mapScale) + 'px' }" @mousedown.prevent="startDrag" @touchstart.prevent="startDrag">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- =========================================
           右側：メインコンテンツ (スマホでは全画面)
      ========================================== -->
      <div class="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 relative">
        
        <!-- PC専用タブヘッダー -->
        <div class="hidden md:flex border-b bg-white shadow-sm z-10 flex-shrink-0">
          <button @click="activeTab = 'search'" :class="activeTab === 'search' ? 'border-blue-500 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'" class="flex-1 py-4 border-b-2 font-bold text-sm transition-colors">🔍 サークル検索</button>
          <button @click="activeTab = 'list'" :class="activeTab === 'list' ? 'border-pink-500 text-pink-600 bg-pink-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'" class="flex-1 py-4 border-b-2 font-bold text-sm transition-colors flex justify-center items-center gap-2">
            📝 買い物リスト <span class="bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full text-xs shadow-sm">{{ savedCount }}</span>
          </button>
          <button @click="activeTab = 'memo'" :class="activeTab === 'memo' ? 'border-green-500 text-green-700 bg-green-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'" class="flex-1 py-4 border-b-2 font-bold text-sm transition-colors">✍️ フリーメモ</button>
        </div>

        <!-- スクロール可能なコンテンツエリア -->
        <div class="flex-1 overflow-y-auto w-full relative">
          
          <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-20 backdrop-blur-sm">
            <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <!-- =========================================
               [スマホ専用] マップ タブ
          ========================================== -->
          <div v-show="activeTab === 'map'" class="md:hidden p-4 space-y-6 pb-24">
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div class="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                <h2 class="text-lg font-bold text-gray-800">イベント概要</h2>
                <div class="text-xs text-gray-600 font-bold bg-gray-100 px-2 py-1 rounded-md">11/14(土)</div>
              </div>
              <ul class="text-sm space-y-3">
                <li class="flex items-start"><span class="w-16 font-bold text-gray-800 shrink-0">9:45-</span><span class="text-gray-700">一般参加者受付開始</span></li>
                <li class="flex items-start"><span class="w-16 font-bold text-gray-800 shrink-0">10:00-</span><span class="text-gray-700">サークル入場 (11:40迄)<br>更衣室利用開始</span></li>
                <li class="flex items-start"><span class="w-16 font-bold text-blue-600 shrink-0">12:00</span><span class="text-blue-700 font-bold">即売会開始</span></li>
                <li class="flex items-start"><span class="w-16 font-bold text-red-500 shrink-0">15:30</span><span class="text-red-600 font-bold">即売会終了</span></li>
                <li class="flex items-start"><span class="w-16 font-bold text-gray-800 shrink-0">15:45-</span><span class="text-gray-700">アフターイベント</span></li>
              </ul>
            </div>
            
            <div>
              <div class="flex justify-between items-end mb-2">
                <h1 class="text-lg font-bold text-gray-800 px-1">会場マップ</h1>
                <span class="text-[10px] text-gray-500 bg-gray-200 px-2 py-1 rounded">📍ピンをドラッグ</span>
              </div>
              <div class="map-container shadow-sm border-gray-200 relative">
                <div class="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
                  <button @click="mapScale = Math.min(mapScale + 0.3, 2.5)" class="w-10 h-10 bg-white/90 shadow-lg rounded-full flex items-center justify-center text-gray-700 font-bold border border-gray-200 active:bg-gray-100 transition" title="拡大">＋</button>
                  <button @click="mapScale = Math.max(mapScale - 0.3, 0.4)" class="w-10 h-10 bg-white/90 shadow-lg rounded-full flex items-center justify-center text-gray-700 font-bold border border-gray-200 active:bg-gray-100 transition" title="縮小">－</button>
                </div>
                <div class="map-inner" @touchmove="dragPin" @mousemove="dragPin" @mouseup="stopDrag" @mouseleave="stopDrag" @touchend="stopDrag">
                  <img src="/map.jpg" alt="会場マップ" class="map-image" loading="lazy" :style="{ width: (900 * mapScale) + 'px' }">
                  <svg class="draggable-pin text-red-600" viewBox="0 0 24 24" fill="currentColor" :style="{ left: (pinX * mapScale) + 'px', top: (pinY * mapScale) + 'px' }" @mousedown.prevent="startDrag" @touchstart.prevent="startDrag">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h2 class="text-sm font-bold mb-3 text-gray-600">配置ブロックで探す</h2>
              <div class="flex flex-wrap gap-2">
                <button v-for="block in blocks" :key="block" @click="toggleBlock(block)"
                        class="min-w-[40px] px-3 py-2 rounded-lg text-sm font-bold transition-all active:scale-95"
                        :class="filterBlock === block ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 border border-gray-200'">
                  {{ block }}
                </button>
              </div>
            </div>
          </div>

          <!-- =========================================
               探す (検索) タブ
          ========================================== -->
          <div v-show="activeTab === 'search'" class="flex flex-col min-h-full pb-20 md:pb-6">
            <div class="p-3 md:p-4 bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
              <div class="relative shadow-sm rounded-xl overflow-hidden bg-white border border-gray-200">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input type="text" v-model="searchQuery" placeholder="サークル名、ペンネームで検索..." 
                       class="w-full pl-10 pr-10 py-3 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                
                <button v-if="searchQuery" @click="searchQuery = ''" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                  <svg class="w-5 h-5 bg-gray-100 rounded-full p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div v-if="filterBlock" class="mt-2 flex items-center gap-2 px-1">
                <span class="text-xs font-bold text-gray-500">選択中のブロック:</span>
                <span class="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer" @click="filterBlock = ''">
                  {{ filterBlock }} <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                </span>
              </div>
              
              <!-- ★ タグ絞り込みフィルター -->
              <div class="mt-3 flex gap-2 overflow-x-auto pb-1 px-1" style="scrollbar-width: none;">
                <button @click="filterTag = ''" class="px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap transition" :class="!filterTag ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'">すべて</button>
                <button v-for="m in availableTags.members" :key="'fm_'+m" @click="filterTag = m" class="px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap border flex items-center gap-1 transition shadow-sm" :style="filterTag === m ? getMemberStyle(m) : {}" :class="filterTag !== m ? 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50' : 'opacity-90'">
                   {{ getMemberMark(m) }} {{ m }}
                </button>
                <button v-for="t in availableTags.tags" :key="'ft_'+t" @click="filterTag = t" class="px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap border transition shadow-sm" :class="filterTag === t ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'">
                   {{ t }}
                </button>
              </div>
            </div>
            
            <!-- 検索タブのサークル一覧 (画像なし、バッジ中心のレイアウト) -->
            <ul class="px-2 md:px-4 mt-2 space-y-2">
              <li v-for="circle in filteredCircles" :key="circle.circle_id" class="p-4 bg-white rounded-xl shadow-sm border border-gray-100 relative">
                
                <button v-if="!isReadOnly" @click="toggleSave(circle.circle_id)" 
                        class="absolute top-4 right-4 p-2 rounded-full transition-all active:scale-90 flex items-center justify-center z-10"
                        :class="savedList[circle.circle_id] ? 'bg-pink-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'">
                  <svg class="h-6 w-6" :fill="savedList[circle.circle_id] ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path v-if="!savedList[circle.circle_id]" d="M12 4v16m8-8H4" />
                    <path v-else d="M5 13l4 4L19 7" />
                  </svg>
                </button>

                <div class="flex flex-col gap-3 pr-12">
                  <div class="flex flex-col gap-1.5">
                    <!-- サークル番号 -->
                    <div class="flex">
                      <span class="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded shadow-sm border border-blue-200">
                        {{ circle.space_sym }}-{{ circle.space_num }}
                      </span>
                    </div>
                    <!-- ★ DBから取得したメンバータグ -->
                    <div v-if="circleExtraInfo[circle.circle_id]?.members?.length" class="flex flex-wrap gap-1.5">
                      <span v-for="member in circleExtraInfo[circle.circle_id].members" :key="'m_'+member" class="px-2 py-0.5 text-[10px] font-bold rounded border shadow-sm flex items-center gap-0.5" :style="getMemberStyle(member)">
                        <span>{{ getMemberMark(member) }}</span>
                        {{ member }}
                      </span>
                    </div>
                    <!-- ★ DBから取得した頒布物タグ -->
                    <div v-if="circleExtraInfo[circle.circle_id]?.tags?.length" class="flex flex-wrap gap-1.5">
                      <span v-for="tag in circleExtraInfo[circle.circle_id].tags" :key="tag" class="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded border border-gray-200 shadow-sm">
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 class="font-bold text-lg leading-tight text-gray-900 mb-0.5">{{ circle.circle_name }}</h3>
                    <p class="text-sm text-gray-500">代表: {{ circle.penname }}</p>
                  </div>
                  <div class="flex items-center gap-2 mt-1">
                    <button v-if="circleExtraInfo[circle.circle_id]?.oshinagaki_url" @click="openDetails(circle)" class="flex items-center gap-1.5 text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition font-bold shadow-sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      お品書き
                    </button>
                    <button v-else disabled class="flex items-center gap-1.5 text-xs bg-gray-200 text-gray-500 px-3 py-1.5 rounded-lg font-bold shadow-sm cursor-not-allowed">
                      お品書き未公開
                    </button>
                    <button @click="jumpToMap(circle)" class="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-bold border border-blue-200 shadow-sm ml-auto">
                      📍 マップ
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- =========================================
               リスト タブ (買い物リスト・予算・優先度)
          ========================================== -->
          <div v-show="activeTab === 'list'" class="flex flex-col min-h-full pb-20 md:pb-6 relative">
            
            <div class="sticky top-0 z-20 bg-gray-50 p-3 md:p-4 border-b border-gray-200 shadow-sm">
              <div v-if="savedCount > 0" class="mb-3">
                <div class="flex justify-between items-end mb-1 px-1">
                  <span class="text-xs font-bold text-gray-600">お買い物 達成度</span>
                  <span class="text-xs font-bold text-blue-600">{{ boughtCount }} / {{ savedCount }} <span class="text-gray-400 text-[10px]">サークル</span> ({{ progressPercent }}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                  <div class="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" :style="{ width: progressPercent + '%' }"></div>
                </div>
              </div>

              <!-- ツールバー -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-2 md:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold text-gray-500">並び:</span>
                    <select v-model="sortOrder" class="text-xs font-bold bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-pink-500 text-gray-700">
                      <option value="default">追加順</option>
                      <option value="space">配置順</option>
                      <option value="priority">優先順</option>
                    </select>
                  </div>
                  <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold transition-colors px-2 py-1 rounded-md border select-none"
                         :class="hideBought ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'">
                    <input type="checkbox" v-model="hideBought" class="accent-pink-500 w-3 h-3">
                    未購入のみ
                  </label>
                </div>
                <div class="flex items-center justify-end gap-2">
                  <div class="flex flex-col items-end gap-0.5">
                    <div class="text-[10px] font-bold text-gray-500">
                      予定総額: ¥{{ totalPrice.toLocaleString() }}
                    </div>
                    <div class="text-sm font-bold bg-pink-50 text-pink-700 px-2.5 py-1 rounded-md border border-pink-100 flex items-center shadow-sm">
                      購入済: <span class="text-base ml-1">¥{{ spentPrice.toLocaleString() }}</span>
                    </div>
                  </div>
                  <button @click="shareToTwitter" class="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-95 transition-transform" title="X (Twitter) でシェア">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </button>
                  <button @click="exportToText" class="p-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 active:scale-95 transition-transform" title="テキストでコピー">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- リスト本体 (画像なしレイアウト) -->
            <div class="p-2 md:p-4">
              <div v-if="sortedSavedCircles.length === 0" class="flex-1 flex flex-col items-center justify-center p-8 text-center mt-10">
                <div class="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-4">
                  <svg class="w-8 h-8 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </div>
                <p class="font-bold text-gray-600 mb-1">表示するサークルがありません</p>
                <p v-if="hideBought && savedCount > 0" class="text-xs text-gray-400 mt-2">（「未購入のみ」がオンになっています）</p>
              </div>
              
              <ul class="space-y-3">
                <li v-for="circle in sortedSavedCircles" :key="circle.circle_id" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative transition-opacity duration-300" :class="{'opacity-50': savedList[circle.circle_id].bought}">
                  
                  <button v-if="!isReadOnly" @click="toggleSave(circle.circle_id)" class="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>

                  <div class="p-4 flex flex-col gap-2 relative pr-8">
                    <div class="flex flex-col gap-1.5 mb-1">
                      <!-- サークル番号 -->
                      <div class="flex">
                        <span class="inline-block px-2 py-0.5 bg-pink-100 text-pink-800 text-xs font-bold rounded border border-pink-200">
                          {{ circle.space_sym }}-{{ circle.space_num }}
                        </span>
                      </div>
                      
                      <!-- ★ メンバータグ -->
                      <div v-if="circleExtraInfo[circle.circle_id]?.members?.length" class="flex flex-wrap gap-1.5">
                        <span v-for="member in circleExtraInfo[circle.circle_id].members" :key="'m_'+member" class="px-2 py-0.5 text-[10px] font-bold rounded border shadow-sm flex items-center gap-0.5" :style="getMemberStyle(member)">
                          <span>{{ getMemberMark(member) }}</span>
                          {{ member }}
                        </span>
                      </div>
                      <!-- ★ 頒布物タグ -->
                      <div v-if="circleExtraInfo[circle.circle_id]?.tags?.length" class="flex flex-wrap gap-1.5">
                        <span v-for="tag in circleExtraInfo[circle.circle_id].tags" :key="tag" class="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded border border-gray-200 shadow-sm">
                          {{ tag }}
                        </span>
                      </div>
                    </div>
                    <h3 class="font-bold text-base text-gray-900 leading-tight">{{ circle.circle_name }}</h3>
                    <div class="flex gap-2">
                       <button v-if="circleExtraInfo[circle.circle_id]?.oshinagaki_url" @click="openDetails(circle)" class="mt-1 flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition font-bold border border-gray-200">
                         お品書き
                       </button>
                       <button v-else disabled class="mt-1 flex items-center gap-1 text-[10px] bg-gray-100 text-gray-400 px-2 py-1 rounded border border-gray-200 cursor-not-allowed">
                         未公開
                       </button>
                       <button @click="jumpToMap(circle)" class="mt-1 ml-auto flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition font-bold border border-blue-200">
                         📍 マップ
                       </button>
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-2 mt-2">
                      <select v-model="savedList[circle.circle_id].priority" :disabled="isReadOnly" class="text-xs border border-gray-200 rounded px-1 py-1 bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none" :class="priorityColors[savedList[circle.circle_id].priority]">
                        <option value="">優先度: -</option>
                        <option value="S">S (絶対買う)</option>
                        <option value="A">A (買いたい)</option>
                        <option value="B">B (見に行く)</option>
                      </select>
                      <div class="flex items-center text-xs border border-gray-200 rounded bg-gray-50 overflow-hidden">
                        <span class="px-1.5 text-gray-500">¥</span>
                        <input type="number" v-model.number="savedList[circle.circle_id].price" :readonly="isReadOnly" placeholder="金額" class="w-14 py-1 px-1 bg-transparent outline-none focus:bg-white text-right">
                      </div>
                      <input type="text" v-model="savedList[circle.circle_id].forWho" :readonly="isReadOnly" placeholder="誰用？(例: 自分)" class="text-xs border border-gray-200 rounded px-1.5 py-1 bg-gray-50 w-24 outline-none focus:bg-white focus:ring-1 focus:ring-pink-400">
                    </div>
                  </div>
                  
                  <div class="bg-pink-50/40 p-3 border-t border-pink-100/50 flex flex-col gap-3">
                    <textarea v-model="savedList[circle.circle_id].memo" :readonly="isReadOnly" placeholder="メモを入力...（例: 新刊セット、アクスタ）" 
                              class="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none h-12 bg-white placeholder-pink-300"></textarea>
                    
                    <button v-if="!isReadOnly" @click="savedList[circle.circle_id].bought = !savedList[circle.circle_id].bought"
                            class="w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 border"
                            :class="savedList[circle.circle_id].bought ? 'bg-gray-100 text-gray-500 border-gray-200 shadow-inner' : 'bg-pink-500 text-white border-pink-600 shadow hover:bg-pink-600 active:scale-95'">
                      <svg v-if="savedList[circle.circle_id].bought" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                      <svg v-else class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      {{ savedList[circle.circle_id].bought ? '購入済み（タップで未購入に戻す）' : '🛒 購入済みにする' }}
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- =========================================
               フリーメモ タブ
          ========================================== -->
          <div v-show="activeTab === 'memo'" class="flex flex-col min-h-full pb-20 md:pb-6 p-4">
            <div class="bg-white rounded-xl shadow-sm border border-green-100 p-4 h-full flex flex-col min-h-[300px]">
              <div class="mb-3 flex items-center gap-2 border-b border-green-50 pb-2">
                <div class="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </div>
                <h2 class="font-bold text-gray-800 text-sm">フリーメモ</h2>
              </div>
              <textarea v-model="freeMemoText" :readonly="isReadOnly" placeholder="・14時に休憩" 
                        class="flex-1 w-full p-3 text-sm rounded-lg border-0 focus:ring-2 focus:ring-green-400 resize-none bg-green-50/30"></textarea>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- スマホ専用ボトムナビゲーション -->
    <div class="md:hidden bg-white border-t border-gray-200 flex justify-around items-center pb-safe fixed bottom-0 w-full z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <button @click="activeTab = 'map'" class="flex-1 py-2.5 flex flex-col items-center gap-1 transition-colors" :class="activeTab === 'map' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
        <span class="text-[10px] font-bold">マップ</span>
      </button>
      <button @click="activeTab = 'search'" class="flex-1 py-2.5 flex flex-col items-center gap-1 transition-colors" :class="activeTab === 'search' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <span class="text-[10px] font-bold">探す</span>
      </button>
      <button @click="activeTab = 'list'" class="flex-1 py-2.5 flex flex-col items-center gap-1 transition-colors relative" :class="activeTab === 'list' ? 'text-pink-600' : 'text-gray-400 hover:text-gray-600'">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
        <span class="text-[10px] font-bold">リスト</span>
        <span v-if="savedCount > 0" class="absolute top-1 right-2 bg-pink-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
          <span v-if="hideBought">{{ savedCount - boughtCount }}</span>
          <span v-else>{{ savedCount }}</span>
        </span>
      </button>
      <button @click="activeTab = 'memo'" class="flex-1 py-2.5 flex flex-col items-center gap-1 transition-colors" :class="activeTab === 'memo' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        <span class="text-[10px] font-bold">メモ</span>
      </button>
    </div>

    <!-- 初回・ヘルプモーダル -->
    <transition name="modal">
      <div v-if="showHelpModal" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 class="font-bold text-lg text-gray-800">ℹ️ このアプリについて</h2>
            <button @click="showHelpModal = false" class="p-2 text-gray-400 hover:bg-gray-200 rounded-full"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div class="p-5 overflow-y-auto space-y-5 text-sm text-gray-700">
            <div>
              <h3 class="font-bold text-blue-600 mb-2 border-b-2 border-blue-100 inline-block">🚀 使い方</h3>
              <ul class="space-y-2 list-disc list-inside">
                <li><span class="font-bold">サークル検索:</span> 気になるサークルを探してリストに追加！</li>
                <li><span class="font-bold">お品書き確認:</span> 「詳細」ボタンから公式Xのお品書きをチェック。</li>
                <li><span class="font-bold">クラウド同期:</span> 任意のIDでログインすれば、他の端末とも同期可能。</li>
              </ul>
            </div>
            <div class="bg-red-50 p-3 rounded-lg border border-red-100">
              <h3 class="font-bold text-red-600 mb-1 flex items-center gap-1">⚠️ 免責事項（非公式ツールです）</h3>
              <p class="text-xs text-red-700 leading-relaxed">
                当アプリは有志が作成した<strong>非公式ツール</strong>です。<br>
                クリエイターの皆様の権利を尊重し、<strong>サークルカット等の画像データを独自のサーバーに保存・AI学習等へ利用することは一切ありません。</strong> お品書き等は全てX(Twitter)公式の機能を利用して埋め込んで表示しています。<br><br>
                イベント公式様や、データ元のサイト様へのお問い合わせは固くお断りいたします。
              </p>
            </div>
          </div>
          <div class="p-4 border-t bg-gray-50">
            <button @click="showHelpModal = false" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">確認してはじめる！</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ★サークル詳細 / お品書き モーダル -->
    <transition name="modal">
      <div v-if="selectedCircle" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <!-- ヘッダー -->
          <div class="p-4 border-b bg-white flex justify-between items-start relative z-10 shadow-sm">
            <div>
              <span class="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded border border-blue-200 mb-1.5">
                {{ selectedCircle.space_sym }}-{{ selectedCircle.space_num }}
              </span>
              <h2 class="font-bold text-xl text-gray-900 leading-tight">{{ selectedCircle.circle_name }}</h2>
              <p class="text-sm text-gray-600 mt-1">代表: {{ selectedCircle.penname }}</p>
            </div>
            <button @click="selectedCircle = null" class="p-2 text-gray-400 hover:bg-gray-200 rounded-full bg-gray-50 transition border border-gray-100 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <!-- コンテンツ（スクロール領域） -->
          <div class="p-4 overflow-y-auto space-y-4 flex-1 bg-gray-50">
            
            <!-- リンク＆タグエリア -->
            <div class="flex flex-wrap gap-2">
              <a v-if="selectedCircle.twitter_id" :href="`https://twitter.com/${selectedCircle.twitter_id}`" target="_blank" class="flex items-center gap-1.5 text-sm bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition font-bold shadow-sm">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                @{{ selectedCircle.twitter_id }}
              </a>
              
              <!-- ★ DBから取得したメンバーを表示 -->
              <span v-for="member in (circleExtraInfo[selectedCircle.circle_id]?.members || [])" :key="'m_'+member" class="text-sm px-3 py-1.5 rounded-full border shadow-sm font-bold flex items-center gap-1" :style="getMemberStyle(member)">
                <span>{{ getMemberMark(member) }}</span>
                {{ member }}
              </span>

              <!-- ★ DBから取得したタグを表示 -->
              <span v-for="tag in (circleExtraInfo[selectedCircle.circle_id]?.tags || [])" :key="tag" class="text-sm px-3 py-1.5 bg-white text-gray-700 rounded-full border border-gray-200 shadow-sm font-bold">{{ tag }}</span>
              <span v-if="!(circleExtraInfo[selectedCircle.circle_id]?.tags?.length) && !(circleExtraInfo[selectedCircle.circle_id]?.members?.length)" class="text-sm px-3 py-1.5 bg-gray-100 text-gray-400 rounded-full border border-dashed border-gray-300">タグ情報なし</span>
            </div>

            <!-- お品書き埋め込みエリア -->
            <div class="bg-white border border-gray-200 rounded-xl p-4 min-h-[300px] flex items-center justify-center text-gray-400 flex-col shadow-inner w-full relative">
              
              <!-- ★ 読み込み中のスケルトンUI -->
              <div v-if="isTweetLoading" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm rounded-xl z-10 transition-opacity duration-300">
                <div class="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p class="text-sm text-gray-500 font-bold animate-pulse">お品書きを読み込み中...</p>
              </div>

              <!-- Xの埋め込みポストが表示されるコンテナ -->
              <div v-show="circleExtraInfo[selectedCircle.circle_id]?.oshinagaki_url" id="tweet-container" class="w-full flex justify-center"></div>
              
              <!-- URLが未登録の場合の表示 -->
              <div v-show="!circleExtraInfo[selectedCircle.circle_id]?.oshinagaki_url" class="text-center text-gray-400 py-6">
                <svg class="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <p class="text-sm font-bold text-gray-500 mb-1">お品書き未登録</p>
                <p class="text-[10px] md:text-xs">※公式Xのポストが登録されると表示されます</p>
              </div>
            </div>

          </div>
          
          <!-- アクションエリア（リスト操作） -->
          <div class="p-4 border-t bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
            <!-- リストに追加されていない場合 -->
            <button v-if="!savedList[selectedCircle.circle_id] && !isReadOnly" @click="toggleSave(selectedCircle.circle_id)" 
                    class="w-full bg-pink-500 text-white font-bold py-3.5 rounded-xl hover:bg-pink-600 transition shadow flex items-center justify-center gap-2 text-lg">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              買い物リストに追加
            </button>
            
            <!-- リストに追加されている場合 -->
            <div v-else-if="savedList[selectedCircle.circle_id]" class="space-y-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-bold text-pink-600 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                  リスト登録済み
                </span>
                <button v-if="!isReadOnly" @click="toggleSave(selectedCircle.circle_id)" class="text-xs text-gray-400 hover:text-red-500 underline">リストから削除</button>
              </div>
              
              <div class="flex flex-wrap items-center gap-2">
                <select v-model="savedList[selectedCircle.circle_id].priority" :disabled="isReadOnly" class="text-sm border border-gray-200 rounded px-2 py-1.5 bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none" :class="priorityColors[savedList[selectedCircle.circle_id].priority]">
                  <option value="">優先度: -</option>
                  <option value="S">S (絶対買う)</option>
                  <option value="A">A (買いたい)</option>
                  <option value="B">B (見に行く)</option>
                </select>
                <div class="flex items-center text-sm border border-gray-200 rounded bg-gray-50 overflow-hidden">
                  <span class="px-2 text-gray-500">¥</span>
                  <input type="number" v-model.number="savedList[selectedCircle.circle_id].price" :readonly="isReadOnly" placeholder="金額" class="w-20 py-1.5 px-1 bg-transparent outline-none focus:bg-white text-right">
                </div>
                <input type="text" v-model="savedList[selectedCircle.circle_id].forWho" :readonly="isReadOnly" placeholder="誰用？(例: 自分)" class="flex-1 min-w-[100px] text-sm border border-gray-200 rounded px-2 py-1.5 bg-gray-50 outline-none focus:bg-white focus:ring-1 focus:ring-pink-400">
              </div>
              <textarea v-model="savedList[selectedCircle.circle_id].memo" :readonly="isReadOnly" placeholder="メモを入力...（例: 新刊セット、アクスタ）" 
                        class="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none h-16 bg-gray-50 focus:bg-white"></textarea>
            </div>
            
            <div v-else class="text-center text-sm text-gray-500 py-2">
              ※閲覧専用モードのため編集できません
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ログイン/登録モーダル -->
    <transition name="modal">
      <div v-if="showAuthModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
          <button @click="showAuthModal = false" class="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          <div class="text-center mb-6"><h2 class="text-xl font-bold">ログイン / 登録</h2></div>
          <div v-if="authError" class="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{{ authError }}</div>
          <div v-if="authMessage" class="bg-blue-50 text-blue-600 p-3 rounded-lg mb-4 text-sm">{{ authMessage }}</div>
          <form @submit.prevent="handleAuth" class="space-y-4">
            <input type="text" v-model="authId" placeholder="ユーザーID（半角英数字）" required class="w-full px-4 py-3 bg-gray-50 border rounded-xl">
            <input type="password" v-model="authPassword" minlength="6" placeholder="パスワード（6文字以上）" required class="w-full px-4 py-3 bg-gray-50 border rounded-xl">
            <div class="flex gap-3 pt-4">
              <button type="submit" @click="authMode = 'login'" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">ログイン</button>
              <button type="submit" @click="authMode = 'register'" class="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold">新規登録</button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- 共有モーダル -->
    <transition name="modal">
      <div v-if="showShareModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
          <button @click="showShareModal = false" class="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          <h2 class="text-xl font-bold text-center mb-6">リストを共有する</h2>
          <div class="flex justify-between p-4 bg-gray-50 rounded-xl border mb-4">
            <span class="font-bold text-sm">公開設定</span>
            <input type="checkbox" v-model="isPublic" @change="togglePublicStatus" class="w-6 h-6 accent-blue-600">
          </div>
          <div v-if="isPublic" class="flex gap-2">
            <input type="text" readonly :value="shareUrl" class="flex-1 bg-gray-100 px-3 py-3 rounded-lg text-xs">
            <button @click="copyShareUrl" class="bg-gray-800 text-white px-4 py-3 rounded-lg text-sm font-bold">コピー</button>
          </div>
          <p v-if="copySuccess" class="text-xs text-green-600 text-center mt-2 font-bold">コピーしました！</p>
        </div>
      </div>
    </transition>

  
</div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { createClient } from '@supabase/supabase-js';

const vspoDict = [{"name":"花芽すみれ","color":"#BECCFF","fanmarks":["👾","💤"]},{"name":"花芽なずな","color":"#FABEDC","fanmarks":["🍣"]},{"name":"小雀とと","color":"#FFF33F","fanmarks":["🔫","🐥"]},{"name":"一ノ瀬うるは","color":"#4182FA","fanmarks":["🌠"]},{"name":"胡桃のあ","color":"#B297D7","fanmarks":["🧸","♔"]},{"name":"兎咲ミミ","color":"#C7B2D6","fanmarks":["🐰","🍭"]},{"name":"空澄セナ","color":"#FFFFFF","fanmarks":["🗝","♠"]},{"name":"橘ひなの","color":"#FA96C8","fanmarks":["🍫","💘"]},{"name":"英リサ","color":"#D1DE79","fanmarks":["💐"]},{"name":"如月れん","color":"#BE2152","fanmarks":["⏰"]},{"name":"神成きゅぴ","color":"#FFD23C","fanmarks":["🌩"]},{"name":"八雲べに","color":"#85CAB3","fanmarks":["💄","💚"]},{"name":"藍沢エマ","color":"#B4F1F9","fanmarks":["🥞","💫"]},{"name":"紫宮るな","color":"#D6ADFF","fanmarks":["☪","🐾"]},{"name":"猫汰つな","color":"#FF3652","fanmarks":["🍒","✨"]},{"name":"白波らむね","color":"#8ECED9","fanmarks":["🐻","❄","🏖"]},{"name":"小森めと","color":"#FBA03F","fanmarks":["🪐"]},{"name":"夢野あかり","color":"#FF8684","fanmarks":["🍼"]},{"name":"夜乃くろむ","color":"#909EC8","fanmarks":["💀","⛓"]},{"name":"紡木こかげ","color":"#5195E1","fanmarks":["📘","💧"]},{"name":"千燈ゆうひ","color":"#ED784A","fanmarks":["🫠"]},{"name":"蝶屋はなび","color":"#EA5506","fanmarks":["🦋","🎆"]},{"name":"甘結もか","color":"#ECA0AA","fanmarks":["🕹","🔖"]},{"name":"銀城サイネ","color":"#58535E","fanmarks":["🎈"]},{"name":"龍巻ちせ","color":"#BEFF77","fanmarks":["🐉","🌪"]},{"name":"オールキャラ","color":"#F59E0B","fanmarks":["🌈"]}];

    const STORAGE_KEY = 'vggc12th_saved_list';

    const supabaseUrl = 'https://lgcwzlzrovdcjaywvmdk.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnY3d6bHpyb3ZkY2pheXd2bWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMjA1NzksImV4cCI6MjEwNDY5NjU3OX0.-axEWTfGBNrtt2POQn7VgkCSCgQH2v3Wn2SIQSgvKYo';
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    

        const circles = ref([]);
        const blocks = ref([]);
        const loading = ref(true);
        const searchQuery = ref('');
        const filterBlock = ref('');
        const filterTag = ref('');
        const activeTab = ref('search');
        const isTweetLoading = ref(false);
        
        const savedList = ref({});
        const freeMemoText = ref('');
        
        const user = ref(null);
        const listId = ref(null);
        const isPublic = ref(false);
        const isSaving = ref(false);
        const isReadOnly = ref(false);
        const isOnline = ref(navigator.onLine);
        
        const showAuthModal = ref(false);
        const showShareModal = ref(false);
        const showHelpModal = ref(false);
        const targetSpace = ref(null);
        const mapCoords = ref({});
        const jumpToMap = (circle) => {
          const spaceId = circle.space_sym + '-' + circle.space_num;
          const blockId = circle.space_sym;
          targetSpace.value = spaceId + ' (' + circle.circle_name + ')';
          activeTab.value = 'map';
          
          // 自動スクロールとピン移動
          setTimeout(() => {
            let targetPos = mapCoords.value[spaceId];
            if (!targetPos && circle.space_num.includes('-')) {
              const baseSpace = circle.space_sym + '-' + circle.space_num.split('-')[0];
              targetPos = mapCoords.value[baseSpace];
            }
            if (!targetPos && mapCoords.value[blockId]) {
              targetPos = mapCoords.value[blockId]; // フォールバック (ブロック単位)
            }
            if (targetPos) {
              pinX.value = targetPos.x;
              pinY.value = targetPos.y;
              
              // コンテナのスクロール位置を調整
              const containers = document.querySelectorAll('.map-inner');
              containers.forEach(container => {
                const scrollX = (targetPos.x * mapScale.value) - (container.clientWidth / 2);
                const scrollY = (targetPos.y * mapScale.value) - (container.clientHeight / 2);
                container.scrollLeft = Math.max(0, scrollX);
                container.scrollTop = Math.max(0, scrollY);
              });
            }
          }, 100);
          
          window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        const authId = ref('');
        const authPassword = ref('');
        const authMode = ref('login');
        const authError = ref('');
        const authMessage = ref('');
        const copySuccess = ref(false);

        const sortOrder = ref('default'); 
        const hideBought = ref(false);
        
        // ★ Supabaseから取得した追加情報（タグ・お品書きURL）を保持するステート
        const circleExtraInfo = ref({});
        
        // 詳細モーダルのステートと、X(Twitter)埋め込みの監視処理
        const selectedCircle = ref(null);
        const openDetails = (circle) => {
          selectedCircle.value = circle;
        };

        watch(selectedCircle, async (newVal) => {
          if (newVal && circleExtraInfo.value[newVal.circle_id]?.oshinagaki_url) {
            isTweetLoading.value = true;
            const url = circleExtraInfo.value[newVal.circle_id].oshinagaki_url;
            
            // DOMの描画完了を待機
            await nextTick();
            const container = document.getElementById('tweet-container');
            if (container && window.twttr) {
              container.innerHTML = ''; // 以前のツイートをクリア
              
              // URLからツイートIDを抽出
              const match = url.match(/status\/(\d+)/);
              if (match) {
                // 公式ウィジェットAPIでツイートを動的に生成
                window.twttr.widgets.createTweet(match[1], container, {
                  align: 'center',
                  conversation: 'all', // スレッド（追加画像）を表示可能にする
                  dnt: true
                }).then(() => {
                  isTweetLoading.value = false;
                });
              } else {
                isTweetLoading.value = false;
                container.innerHTML = `<a href="${url}" target="_blank" class="text-blue-500 underline font-bold mt-4 block">お品書きを見る (Xへ移動)</a>`;
              }
            }
          } else {
            isTweetLoading.value = false;
          }
        });
        
        const getMemberStyle = (name) => {
          const found = vspoDict.find(d => d.name === name);
          if (found) {
            const hex = found.color;
            if (hex === '#FFFFFF') return { backgroundColor: '#ffffff', borderColor: '#d1d5db', color: '#374151' };
            return { backgroundColor: hex + '40', borderColor: hex, color: '#374151' };
          }
          return { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', color: '#15803d' };
        };

        const getMemberMark = (name) => {
          const found = vspoDict.find(d => d.name === name);
          if (found && found.fanmarks.length > 0) {
            return found.fanmarks[0];
          }
          return '👤';
        };

        const mapScale = ref(1.0);
        const pinX = ref(100);
        const pinY = ref(100);
        let isDraggingPin = false;

        const priorityColors = {
          'S': 'text-red-700 font-bold bg-red-100',
          'A': 'text-orange-700 font-bold bg-orange-100',
          'B': 'text-blue-700 font-bold bg-blue-100',
          '': 'text-gray-500'
        };

        const shareUrl = computed(() => {
          if (!listId.value) return '';
          const url = new URL(window.location.href);
          url.searchParams.set('list', listId.value);
          return url.toString();
        });

        const syncFreeMemoFromState = () => {
          if (savedList.value['__FREE_MEMO__']) freeMemoText.value = savedList.value['__FREE_MEMO__'].text || '';
          if (savedList.value['__PIN_POS__']) {
            pinX.value = savedList.value['__PIN_POS__'].x || 100;
            pinY.value = savedList.value['__PIN_POS__'].y || 100;
          }
        };

        const saveToCloud = async (newVal) => {
          if (!user.value || !isOnline.value || isReadOnly.value) return; 
          clearTimeout(saveTimeout); isSaving.value = true;
          saveTimeout = setTimeout(async () => {
            try {
              await supabaseClient.from('shopping_lists').update({ list_data: newVal, updated_at: new Date().toISOString() }).eq('user_id', user.value.id);
            } catch (err) {
              console.error('Cloud save failed:', err);
            } finally {
              isSaving.value = false;
            }
          }, 3000); 
        };

        onMounted(async () => {
          window.addEventListener('online', () => {
            isOnline.value = true;
            if (user.value && !isReadOnly.value) saveToCloud(savedList.value);
          });
          window.addEventListener('offline', () => {
            isOnline.value = false;
          });

          if (!localStorage.getItem('vggc_help_shown')) {
            showHelpModal.value = true;
            localStorage.setItem('vggc_help_shown', 'true');
          }

          const urlParams = new URLSearchParams(window.location.search);
          const sharedListId = urlParams.get('list');
          
          if (sharedListId) {
            isReadOnly.value = true;
            activeTab.value = 'list';
            await loadSharedList(sharedListId);
          } else {
            const { data: { session } } = await supabaseClient.auth.getSession();
            user.value = session?.user || null;
            if (user.value && isOnline.value) {
              await loadCloudList(user.value.id);
            } else {
              const stored = localStorage.getItem(STORAGE_KEY);
              if (stored) {
                try { savedList.value = JSON.parse(stored); syncFreeMemoFromState(); } catch (e) {}
              }
            }
          }

          supabaseClient.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user || null;
            user.value = currentUser;
            if (currentUser && !isReadOnly.value && isOnline.value) await loadCloudList(currentUser.id);
          });

          // データの並列読み込み (data.json & Supabase circle_info)
          try {
            const [localRes, supabaseRes] = await Promise.all([
              fetch('/data.json'),
              supabaseClient.from('circle_info').select('circle_id, tags, members, oshinagaki_url')
            ]);
            
            // 静的データのマッピング
            if (localRes.ok) {
              const data = await localRes.json();
              circles.value = data.circles;
              blocks.value = data.sort_order;
            }
            
            // Supabaseからの追加情報のマッピング
            if (!supabaseRes.error && supabaseRes.data) {
              const infoMap = {};
              supabaseRes.data.forEach(info => {
                infoMap[info.circle_id] = {
                  tags: info.tags || [],
                  members: info.members || [],
                  oshinagaki_url: info.oshinagaki_url || ''
                };
              });
              circleExtraInfo.value = infoMap;
            }

            // Supabase Realtime
            supabaseClient
              .channel('public:circle_info')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'circle_info' }, (payload) => {
                if (payload.new && payload.new.circle_id) {
                  circleExtraInfo.value[payload.new.circle_id] = {
                    tags: payload.new.tags || [],
                    members: payload.new.members || [],
                    oshinagaki_url: payload.new.oshinagaki_url || ''
                  };
                }
              })
              .subscribe();
          } catch (error) { 
            console.error('Data loading error:', error); 
          } finally { 
            loading.value = false; 
          }
        });

        const loadSharedList = async (id) => {
          const { data } = await supabaseClient.from('shopping_lists').select('list_data, is_public').eq('id', id).single();
          if (data && data.is_public) {
            savedList.value = data.list_data || {}; syncFreeMemoFromState();
          } else {
            alert('共有リストが見つからないか非公開です。'); exitReadOnly();
          }
        };

        const loadCloudList = async (userId) => {
          const { data } = await supabaseClient.from('shopping_lists').select('*').eq('user_id', userId).single();
          if (data) {
            savedList.value = data.list_data || {}; isPublic.value = data.is_public; listId.value = data.id; syncFreeMemoFromState();
          } else {
            const stored = localStorage.getItem(STORAGE_KEY);
            let initialData = {};
            if (stored) { try { initialData = JSON.parse(stored); } catch (e) {} }
            const { data: newData } = await supabaseClient.from('shopping_lists').insert({ user_id: userId, list_data: initialData }).select().single();
            if (newData) { savedList.value = newData.list_data; listId.value = newData.id; syncFreeMemoFromState(); }
          }
        };

        let saveTimeout = null;
        watch(savedList, (newVal) => {
          if (isReadOnly.value) return; 
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
          saveToCloud(newVal);
        }, { deep: true });

        watch(freeMemoText, (newText) => {
          if (isReadOnly.value) return;
          if (!savedList.value['__FREE_MEMO__']) savedList.value['__FREE_MEMO__'] = {};
          savedList.value['__FREE_MEMO__'].text = newText;
        });

        const savePinPos = () => {
          if (isReadOnly.value) return;
          if (!savedList.value['__PIN_POS__']) savedList.value['__PIN_POS__'] = {};
          savedList.value['__PIN_POS__'].x = pinX.value;
          savedList.value['__PIN_POS__'].y = pinY.value;
        };

        const toggleSave = (circleId) => {
          if (isReadOnly.value) return;
          if (savedList.value[circleId]) {
            delete savedList.value[circleId];
          } else {
            savedList.value[circleId] = { memo: '', bought: false, price: '', priority: '', forWho: '' };
          }
        };

        const toggleBlock = (block) => { filterBlock.value = filterBlock.value === block ? '' : block; activeTab.value = 'search'; };
        
        const startDrag = () => { if(!isReadOnly.value) isDraggingPin = true; };
        const stopDrag = () => { if(isDraggingPin){ isDraggingPin = false; savePinPos(); } };
        const dragPin = (e) => {
          if (!isDraggingPin) return;
          e.preventDefault();
          const container = e.currentTarget; 
          const rect = container.getBoundingClientRect();
          let clientX, clientY;
          if (e.touches && e.touches.length > 0) {
             clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
          } else {
             clientX = e.clientX; clientY = e.clientY;
          }
          const x = clientX - rect.left;
          const y = clientY - rect.top;
          pinX.value = Math.max(0, Math.min(x, container.offsetWidth)) / mapScale.value;
          pinY.value = Math.max(0, Math.min(y, container.offsetHeight)) / mapScale.value;
        };

        const shareToTwitter = () => {
          let text = "🛒 ぶいごまVGGC12th 買い出しリスト\n\n";
          text += `予算: ¥${totalPrice.value.toLocaleString()}\n`;
          if (spentPrice.value > 0) text += `購入済: ¥${spentPrice.value.toLocaleString()}\n`;
          text += `(全${savedCount.value}サークル中、${boughtCount.value}サークル達成)\n\n`;
          text += "#VGGC12th\n";
          if (listId.value && isPublic.value) {
            text += `\n${shareUrl.value}`;
          }
          const encoded = encodeURIComponent(text);
          window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
        };

        const exportToText = () => {
          let text = "📝 買い物リスト (VGGC 12th)\n";
          text += `合計予定額: ¥${totalPrice.value.toLocaleString()}\n\n`;
          sortedSavedCircles.value.forEach(c => {
            const data = savedList.value[c.circle_id];
            const status = data.bought ? '[済]' : '[未]';
            const prio = data.priority ? `(${data.priority})` : '';
            const price = data.price ? ` ¥${data.price}` : '';
            const who = data.forWho ? ` @${data.forWho}` : '';
            text += `${status} ${c.space_sym}-${c.space_num} ${c.circle_name} ${prio}${price}${who}\n`;
            if (data.memo) text += `  メモ: ${data.memo}\n`;
          });
          navigator.clipboard.writeText(text).then(() => alert("クリップボードにコピーしました！X(Twitter)やメモ帳に貼り付けられます。"));
        };

        const totalPrice = computed(() => {
          let total = 0;
          Object.keys(savedList.value).forEach(key => {
             if (key.startsWith('__')) return;
             const price = parseInt(savedList.value[key].price);
             if (!isNaN(price)) total += price;
          });
          return total;
        });

        const spentPrice = computed(() => {
          let total = 0;
          Object.keys(savedList.value).forEach(key => {
             if (key.startsWith('__')) return;
             if (savedList.value[key].bought) {
               const price = parseInt(savedList.value[key].price);
               if (!isNaN(price)) total += price;
             }
          });
          return total;
        });

        const savedCount = computed(() => Object.keys(savedList.value).filter(k => !k.startsWith('__')).length);
        
        const boughtCount = computed(() => {
          return Object.keys(savedList.value).filter(k => !k.startsWith('__') && savedList.value[k].bought).length;
        });
        const progressPercent = computed(() => {
          if (savedCount.value === 0) return 0;
          return Math.round((boughtCount.value / savedCount.value) * 100);
        });
        
        const sortedSavedCircles = computed(() => {
          let list = circles.value.filter(c => savedList.value[c.circle_id]);
          if (hideBought.value) list = list.filter(c => !savedList.value[c.circle_id].bought);
          if (sortOrder.value === 'space') {
            list.sort((a, b) => {
              if (a.space_sym !== b.space_sym) return a.space_sym.localeCompare(b.space_sym);
              return parseInt(a.space_num) - parseInt(b.space_num);
            });
          } else if (sortOrder.value === 'priority') {
            const weight = { 'S': 3, 'A': 2, 'B': 1, '': 0 };
            list.sort((a, b) => {
              const wa = weight[savedList.value[a.circle_id].priority || ''];
              const wb = weight[savedList.value[b.circle_id].priority || ''];
              if (wa !== wb) return wb - wa;
              return 0; 
            });
          }
          return list;
        });

        const availableTags = computed(() => {
          const tags = new Set();
          const members = new Set();
          Object.values(circleExtraInfo.value).forEach(info => {
            (info.tags || []).forEach(t => tags.add(t));
            (info.members || []).forEach(m => members.add(m));
          });
          return { tags: Array.from(tags).sort(), members: Array.from(members).sort() };
        });

        const filteredCircles = computed(() => {
          return circles.value.filter(circle => {
            const matchQuery = !searchQuery.value || 
              (circle.circle_name && circle.circle_name.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
              (circle.penname && circle.penname.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
              (circle.circle_kana && circle.circle_kana.includes(searchQuery.value));
            const matchBlock = !filterBlock.value || circle.space_sym === filterBlock.value;
            
            const extra = circleExtraInfo.value[circle.circle_id] || {};
            const matchTag = !filterTag.value || 
              (extra.tags || []).includes(filterTag.value) || 
              (extra.members || []).includes(filterTag.value);
              
            return matchQuery && matchBlock && matchTag;
          });
        });

        const togglePublicStatus = async () => { if(user.value) await supabaseClient.from('shopping_lists').update({ is_public: isPublic.value }).eq('user_id', user.value.id); };
        const handleAuth = async () => {
          if (!isOnline.value) {
            authError.value = 'オフライン状態ではログイン・登録できません。通信環境を確認してください。';
            return;
          }
          authError.value = ''; authMessage.value = '';
          const dummyEmail = authId.value + '@vggc.dummy.local';
          try {
            if (authMode.value === 'register') {
              const { error } = await supabaseClient.auth.signUp({ email: dummyEmail, password: authPassword.value });
              if (error) throw error;
              authMessage.value = '登録成功！ログインします...';
              setTimeout(() => { if (user.value) showAuthModal.value = false; }, 1000);
            } else {
              const { error } = await supabaseClient.auth.signInWithPassword({ email: dummyEmail, password: authPassword.value });
              if (error) throw error;
              showAuthModal.value = false;
            }
          } catch (err) {
            authError.value = err.message === 'Invalid login credentials' ? 'IDまたはパスワードが間違っています。' : err.message;
          }
        };
        const signOut = async () => { await supabaseClient.auth.signOut(); savedList.value = {}; listId.value = null; isPublic.value = false; freeMemoText.value = ''; };
        const exitReadOnly = () => { const url = new URL(window.location.href); url.searchParams.delete('list'); window.location.href = url.toString(); };
        const copyShareUrl = () => { navigator.clipboard.writeText(shareUrl.value); copySuccess.value = true; setTimeout(() => copySuccess.value = false, 2000); };

        
</script>

<style scoped>

    body { font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; -webkit-tap-highlight-color: transparent; overscroll-behavior-y: none; }
    
    .map-container { 
      position: relative; 
      width: 100%; 
      overflow: auto; 
      border: 1px solid #e5e7eb; 
      border-radius: 0.5rem; 
      background: #fff; 
      -webkit-overflow-scrolling: touch; 
    }
    
    .map-inner {
      position: relative;
      width: max-content; 
      transform: translateZ(0); 
    }

    .map-image { 
      width: 900px; 
      max-width: none; 
      display: block; 
      user-select: none;
      -webkit-user-drag: none;
      pointer-events: none; 
      transform: translateZ(0);
      transition: width 0.2s ease-out;
    }
    
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    
    .modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
    .modal-enter-from, .modal-leave-to { opacity: 0; transform: translateY(10px); }
    
    .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
    [v-cloak] { display: none; }

    .draggable-pin {
      position: absolute; 
      width: 32px; 
      height: 32px; 
      transform: translate3d(-50%, -100%, 0); 
      cursor: grab; 
      z-index: 10; 
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      will-change: left, top;
      backface-visibility: hidden;
      transition: left 0.2s ease-out, top 0.2s ease-out;
    }
    .draggable-pin:active { cursor: grabbing; transition: none; }
  
</style>