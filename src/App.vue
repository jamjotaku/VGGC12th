<template>
<div class="font-sans bg-gray-50 text-gray-900 h-screen flex flex-col pt-12 md:pt-11 pb-14 md:pb-0 overflow-hidden">

    <!-- ナビゲーションバー -->
    <nav class="bg-white shadow-sm border-b px-3 md:px-4 py-2 md:py-2.5 flex justify-between items-center z-20 flex-shrink-0">
      <div class="font-bold text-base md:text-lg flex items-center gap-2">
        VGGC 12th 
        <span v-if="isReadOnly" class="text-[10px] md:text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">閲覧専用</span>
        <!-- 全員に見えるオフライン/圏外インジケーター -->
        <span v-if="!isOnline" class="text-[10px] md:text-xs bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm" title="圏外（保存済みデータで動作中）">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>圏外(保存済)</span>
        </span>
      </div>
      <div class="flex items-center gap-2 md:gap-3">
        <!-- ヘルプボタン -->
        <button @click="showHelpModal = true" class="p-1 md:p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition cursor-pointer" title="ヘルプ・免責事項">
          <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>

        <button v-if="isReadOnly" @click="exitReadOnly" class="text-xs md:text-sm bg-gray-800 text-white px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-700 transition cursor-pointer">
          <span class="hidden md:inline">自分のリストへ戻る</span>
          <span class="md:hidden">戻る</span>
        </button>
        
        <template v-if="!user && !isReadOnly">
          <button @click="showAuthModal = true" class="text-xs md:text-sm bg-blue-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-1 cursor-pointer">
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
            <button @click="showShareModal = true" class="text-xs md:text-sm bg-pink-50 text-pink-600 border border-pink-200 p-1.5 md:px-3 md:py-1.5 rounded-lg hover:bg-pink-100 transition flex items-center gap-1 font-bold cursor-pointer" title="共有">
              <svg class="h-4 w-4 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              <span class="hidden md:inline">共有</span>
            </button>
            <button @click="signOut" class="text-gray-500 hover:text-gray-800 p-1.5 md:p-0 transition flex items-center gap-1 cursor-pointer" title="ログアウト">
              <svg class="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              <span class="text-xs underline hidden md:block">ログアウト</span>
            </button>
          </div>
        </template>
      </div>
    </nav>

    <!-- 11/14 当日カウントダウン ＆ 進行状況バー（全画面共通・アコーディオン展開対応） -->
    <EventCountdownBar :countdown="eventCountdown" :is-current-schedule="isCurrentSchedule" />

    <!-- メインレイアウト -->
    <div class="flex-1 flex overflow-hidden bg-gray-100 min-h-0">
      
      <!-- =========================================
           左側：マップ ＆ クイックナビエリア (PC専用・マップ表示領域最大化)
      ========================================== -->
      <div class="hidden md:flex w-5/12 lg:w-[44%] xl:w-[42%] flex-col bg-white border-r border-gray-200 shadow-sm h-full overflow-hidden p-3.5 gap-2">
        <!-- マップヘッダー -->
        <div class="flex justify-between items-center gap-2 shrink-0">
          <div class="flex items-center gap-2 min-w-0">
            <h1 class="text-base font-extrabold text-gray-800 flex items-center gap-1.5 shrink-0">
              <span>🗺️</span>
              <span>会場マップ</span>
            </h1>
            <span v-if="targetSpace && !focusedMapCircle" class="text-xs font-bold bg-pink-100 text-pink-800 border border-pink-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs truncate">
              <span class="truncate">📍 {{ targetSpace }}</span>
              <button @click="clearMapFocus" class="hover:text-pink-950 ml-0.5 cursor-pointer" title="ターゲットピンを消す">×</button>
            </span>
          </div>

          <!-- 買い物リストプロット ON/OFF トグル -->
          <button @click="showListPins = !showListPins"
                  class="text-[11px] font-extrabold px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  :class="showListPins ? 'bg-slate-800 text-white border-slate-900' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'">
            <span>🛒 リスト表示: {{ showListPins ? 'ON' : 'OFF' }}</span>
            <span v-if="showListPins" class="px-1.5 py-0.2 bg-white/20 rounded text-[10px] font-mono">{{ activeListMapPins.length }}</span>
          </button>
        </div>

        <!-- 4原色カラー凡例バー (リスト表示ON時) -->
        <div v-if="showListPins" class="flex items-center justify-between px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] font-bold text-slate-700 shrink-0 gap-2">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-500 inline-block ring-1 ring-red-900"></span>S:最優先</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block ring-1 ring-yellow-800"></span>A:買いたい</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block ring-1 ring-blue-900"></span>B:見に行く</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ring-1 ring-emerald-900"></span>未設定</span>
          </div>
          <button @click="showCompletedPins = !showCompletedPins"
                  class="text-[10px] px-1.5 py-0.5 rounded border transition shrink-0 cursor-pointer"
                  :class="showCompletedPins ? 'bg-slate-200 text-slate-800 border-slate-300 font-bold' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'"
                  title="購入済・完売サークルのドット表示切り替え">
            {{ showCompletedPins ? '✓ 済も薄く表示中' : '済・完売は自動消去' }}
          </button>
        </div>

        <!-- PC用マップビューポートラッパー (ズームボタンとアクションバーをスクロール領域外に固定) -->
        <div class="relative flex-1 min-h-[220px] flex flex-col rounded-xl border border-gray-200 bg-white shadow-inner overflow-hidden">
          <!-- 固定ズームコントロール (スクロールしても常に右下に固定・アクションバー表示時は自動で上に退避) -->
          <div class="absolute right-3 flex flex-col gap-1.5 z-20 transition-all duration-200"
               :class="focusedMapCircle ? 'bottom-16' : 'bottom-3'">
            <button @click="changeMapScale(0.25)" class="w-9 h-9 bg-white/95 shadow-md rounded-xl flex items-center justify-center text-gray-700 font-bold border border-gray-200 active:scale-95 hover:bg-gray-50 transition cursor-pointer" title="拡大 (Ctrl+ホイール)">＋</button>
            <button @click="mapScale = 1.0" class="w-9 h-7 bg-white/95 shadow-md rounded-xl flex items-center justify-center text-[10px] text-gray-600 font-bold border border-gray-200 active:scale-95 hover:bg-gray-50 transition cursor-pointer" title="100%にリセット">{{ Math.round(mapScale * 100) }}%</button>
            <button @click="changeMapScale(-0.25)" class="w-9 h-9 bg-white/95 shadow-md rounded-xl flex items-center justify-center text-gray-700 font-bold border border-gray-200 active:scale-95 hover:bg-gray-50 transition cursor-pointer" title="縮小 (Ctrl+ホイール)">－</button>
          </div>

          <!-- スクロール領域本体 -->
          <div class="map-container flex-1 w-full h-full"
               @wheel="handleMapWheel"
               @mousedown="startMapPan"
               @mousemove="moveMapPan"
               @mouseup="endMapPan"
               @mouseleave="endMapPan">
            <div class="map-inner"
                 :class="isPanningMap ? 'cursor-grabbing' : 'cursor-grab'"
                 @mousedown="handleMapPointerDown"
                 @touchstart.passive="handleMapPointerDown"
                 @click="handleMapClick"
                 @touchmove="dragPin" @mousemove="dragPin" @mouseup="stopDrag" @mouseleave="stopDrag" @touchend="stopDrag">
              <img src="/map.jpg" alt="会場マップ" class="map-image" loading="lazy" :style="{ width: (900 * mapScale) + 'px' }">

              <!-- ★ 買い物リストサークルの極小カラードット (4原色・pointer-events-none・近傍スナップ選択対応) -->
              <div v-for="item in activeListMapPins" :key="'pc_mp_'+item.circle_id"
                   class="list-map-dot pointer-events-none select-none"
                   :style="getListPinStyle(item)">
              </div>

              <!-- ターゲットピン (案B: targetSpace選択時のみ表示) -->
              <div v-if="targetSpace"
                   class="draggable-pin select-none flex items-center justify-center"
                   :style="{ left: (pinX * mapScale) + 'px', top: (pinY * mapScale) + 'px' }"
                   @mousedown.stop="startDrag"
                   @touchstart.stop="startDrag">
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-gray-900/95 text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-md border border-white/20 pointer-events-none">
                  {{ targetSpace }}
                </div>
                <span class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 rounded-full bg-rose-500/40 ring-2 ring-rose-600 animate-ping pointer-events-none"></span>
                <span class="text-2xl leading-none relative z-10">📍</span>
              </div>
            </div>
          </div>

          <!-- ★ マップ選択中サークルのクイックアクションバー (PC: マップ下部オーバーレイ固定でガタつき防止) -->
          <div v-if="focusedMapCircle" class="absolute bottom-2 inset-x-2 z-20 bg-slate-900/95 backdrop-blur-xs text-white rounded-xl px-3 py-2 shadow-lg flex items-center justify-between gap-2 border border-slate-700">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <!-- 前後サークル順送りボタン (リスト複数登録時) -->
              <div v-if="spaceOrderedListPins.length > 1" class="flex items-center gap-0.5 shrink-0">
                <button @click="stepMapPin(-1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer" title="前の配置のリストサークルへ">◀</button>
                <button @click="stepMapPin(1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer" title="次の配置のリストサークルへ">▶</button>
              </div>
              <span class="px-1.5 py-0.5 rounded text-[11px] font-extrabold shrink-0" :class="getFocusedPinBadgeClass(focusedMapCircle.circle_id)">
                {{ focusedMapCircle.space_sym }}-{{ focusedMapCircle.space_num }}
              </span>
              <div class="min-w-0 flex-1">
                <div class="text-xs font-extrabold truncate">{{ focusedMapCircle.circle_name }}</div>
                <div v-if="savedList[focusedMapCircle.circle_id]" class="text-[10px] text-slate-300 truncate flex items-center gap-1.5">
                  <span v-if="savedList[focusedMapCircle.circle_id].priority">優先:{{ savedList[focusedMapCircle.circle_id].priority }}</span>
                  <span v-if="savedList[focusedMapCircle.circle_id].price">¥{{ Number(savedList[focusedMapCircle.circle_id].price).toLocaleString() }}</span>
                  <span v-if="savedList[focusedMapCircle.circle_id].memo" class="text-amber-300 truncate">📝{{ savedList[focusedMapCircle.circle_id].memo }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button @click="openDetails(focusedMapCircle)"
                      class="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1 shadow-xs">
                <span>📸</span>
                <span>詳細</span>
              </button>
              <button v-if="!isReadOnly && savedList[focusedMapCircle.circle_id]"
                      @click="toggleBought(focusedMapCircle.circle_id)"
                      class="px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1 border"
                      :class="savedList[focusedMapCircle.circle_id].bought ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'">
                <span>{{ savedList[focusedMapCircle.circle_id].bought ? '✓ 済' : '🛒 済にする' }}</span>
              </button>
              <button @click="clearMapFocus" class="w-6 h-6 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer" title="閉じる">×</button>
            </div>
          </div>
        </div>

        <!-- PC用 配置ブロック絞り込み ＆ 会場速報 (折りたたみ対応でノートPCでもマップ領域を広く確保可能) -->
        <div class="bg-gray-50 rounded-xl px-3 py-2 border border-gray-200/80 shrink-0 space-y-2">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <button @click="showPcBlockPanel = !showPcBlockPanel"
                      class="text-[11px] font-extrabold text-gray-700 hover:text-gray-900 flex items-center gap-1 cursor-pointer select-none">
                <span>🧭</span>
                <span>配置ブロック ＆ 会場X速報</span>
                <svg class="w-3.5 h-3.5 text-gray-400 transition-transform duration-200" :class="showPcBlockPanel ? '' : 'rotate-180'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <button v-if="filterBlock" @click="selectBlockAndFocusMap(filterBlock)" class="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer">
                解除 ({{ filterBlock }})
              </button>
            </div>

            <!-- 折りたたみ中も会場速報リンクへ即アクセス可能 -->
            <div v-if="!showPcBlockPanel" class="flex items-center gap-1">
              <a :href="getEventLiveSearchUrl('soldout')" target="_blank" class="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[10px] font-bold">💔完売</a>
              <a :href="getEventLiveSearchUrl('line')" target="_blank" class="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded text-[10px] font-bold">🚶列</a>
              <a :href="getEventLiveSearchUrl('all')" target="_blank" class="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[10px] font-bold">📢速報</a>
            </div>
          </div>

          <div v-show="showPcBlockPanel" class="space-y-2">
            <div class="flex flex-wrap gap-1">
              <button v-for="block in blocks" :key="'pc_b_'+block" @click="selectBlockAndFocusMap(block)"
                      class="min-w-[32px] h-7 px-2 rounded-lg text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
                      :class="filterBlock === block ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300' : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50 hover:border-blue-200'">
                {{ block }}
              </button>
            </div>

            <div class="pt-1.5 border-t border-gray-200/70 flex items-center justify-between gap-2">
              <span class="text-[11px] font-extrabold text-slate-700 flex items-center gap-1 shrink-0">
                <span class="text-amber-500">⚡</span>会場X速報:
              </span>
              <div class="grid grid-cols-3 gap-1.5 flex-1">
                <a :href="getEventLiveSearchUrl('soldout')" target="_blank" 
                   class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition">
                  <span>💔 完売</span>
                </a>
                <a :href="getEventLiveSearchUrl('line')" target="_blank" 
                   class="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition">
                  <span>🚶 列情報</span>
                </a>
                <a :href="getEventLiveSearchUrl('all')" target="_blank" 
                   class="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition">
                  <span>📢 #VGGC12th</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- =========================================
           右側：メインコンテンツ (スマホでは全画面)
      ========================================== -->
      <div class="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 relative min-w-0">
        
        <!-- PC専用タブヘッダー -->
        <div class="hidden md:flex border-b bg-white shadow-xs z-10 flex-shrink-0">
          <button @click="activeTab = 'search'" :class="activeTab === 'search' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'" class="flex-1 py-3 border-b-2 font-extrabold text-sm transition-colors flex justify-center items-center gap-1.5 cursor-pointer">
            <span>🔍 サークルを探す</span>
            <span class="text-xs px-2 py-0.5 rounded-full" :class="activeTab === 'search' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'">{{ filteredCircles.length }}</span>
          </button>
          <button @click="activeTab = 'list'" :class="activeTab === 'list' ? 'border-pink-500 text-pink-600 bg-pink-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'" class="flex-1 py-3 border-b-2 font-extrabold text-sm transition-colors flex justify-center items-center gap-2 cursor-pointer">
            <span>📝 買い物リスト</span>
            <span class="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-xs shadow-xs">{{ savedCount }}</span>
          </button>
          <button @click="activeTab = 'memo'" :class="activeTab === 'memo' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'" class="flex-1 py-3 border-b-2 font-extrabold text-sm transition-colors cursor-pointer">
            ✍️ 準備・フリーメモ
          </button>
        </div>

        <!-- スクロール可能なコンテンツエリア -->
        <div class="flex-1 overflow-y-auto w-full relative min-h-0">
          
          <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-20 backdrop-blur-sm">
            <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <!-- =========================================
               [スマホ専用] マップ タブ
          ========================================== -->
          <div v-show="activeTab === 'map'" class="md:hidden p-2.5 space-y-2.5 pb-20">
            <div class="space-y-2">
              <div class="flex justify-between items-center gap-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <h1 class="text-base font-extrabold text-gray-800 px-0.5 shrink-0">🗺️ 会場マップ</h1>
                  <span v-if="targetSpace && !focusedMapCircle" class="text-[11px] font-bold bg-pink-100 text-pink-800 border border-pink-200 px-2 py-0.5 rounded-full flex items-center gap-1 truncate">
                    <span class="truncate">📍 {{ targetSpace }}</span>
                    <button @click="clearMapFocus" class="ml-0.5">×</button>
                  </span>
                </div>
                <button @click="showListPins = !showListPins"
                        class="text-[11px] font-extrabold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 shrink-0"
                        :class="showListPins ? 'bg-slate-800 text-white border-slate-900' : 'bg-gray-200/80 text-gray-700 border-gray-300'">
                  <span>🛒 リスト表示: {{ showListPins ? 'ON' : 'OFF' }}</span>
                  <span v-if="showListPins" class="px-1 bg-white/20 rounded text-[10px] font-mono">{{ activeListMapPins.length }}</span>
                </button>
              </div>

              <!-- スマホ用 4原色カラー凡例バー -->
              <div v-if="showListPins" class="flex items-center justify-between px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-slate-700 shadow-2xs gap-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-500 inline-block ring-1 ring-red-900"></span>S:最優先</span>
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block ring-1 ring-yellow-800"></span>A:買いたい</span>
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block ring-1 ring-blue-900"></span>B:見に行く</span>
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ring-1 ring-emerald-900"></span>未</span>
                </div>
                <button @click="showCompletedPins = !showCompletedPins"
                        class="text-[10px] px-1.5 py-0.5 rounded border transition shrink-0"
                        :class="showCompletedPins ? 'bg-slate-200 text-slate-800 border-slate-300 font-bold' : 'bg-gray-50 text-slate-500 border-gray-200'">
                  {{ showCompletedPins ? '✓済表示中' : '済は消去' }}
                </button>
              </div>

              <!-- スマホ用マップビューポートラッパー (ズームボタンとアクションバーを固定しガタつきゼロ化) -->
              <div class="relative h-[58vh] min-h-[290px] max-h-[540px] flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <!-- 固定ズームコントロール (スクロールしても流れない・アクションバー表示時は上に自動退避) -->
                <div class="absolute right-3 flex flex-col gap-1.5 z-20 transition-all duration-200"
                     :class="focusedMapCircle ? 'bottom-16' : 'bottom-3'">
                  <button @click="changeMapScale(0.25)" class="w-10 h-10 bg-white/95 shadow-lg rounded-xl flex items-center justify-center text-gray-800 font-bold border border-gray-200 active:bg-gray-100 transition" title="拡大">＋</button>
                  <button @click="mapScale = 1.0" class="w-10 h-7 bg-white/95 shadow-lg rounded-xl flex items-center justify-center text-[10px] text-gray-600 font-bold border border-gray-200 active:bg-gray-100 transition" title="リセット">{{ Math.round(mapScale * 100) }}%</button>
                  <button @click="changeMapScale(-0.25)" class="w-10 h-10 bg-white/95 shadow-lg rounded-xl flex items-center justify-center text-gray-800 font-bold border border-gray-200 active:bg-gray-100 transition" title="縮小">－</button>
                </div>

                <!-- スクロール領域本体 -->
                <div class="map-container flex-1 w-full h-full">
                  <div class="map-inner"
                       @mousedown="handleMapPointerDown"
                       @touchstart.passive="handleMapPointerDown"
                       @click="handleMapClick"
                       @touchmove="dragPin" @mousemove="dragPin" @mouseup="stopDrag" @mouseleave="stopDrag" @touchend="stopDrag">
                    <img src="/map.jpg" alt="会場マップ" class="map-image" loading="lazy" :style="{ width: (900 * mapScale) + 'px' }">

                    <!-- ★ 買い物リストサークルの極小カラードット (4原色・pointer-events-none・近傍スナップ選択対応) -->
                    <div v-for="item in activeListMapPins" :key="'mb_mp_'+item.circle_id"
                         class="list-map-dot pointer-events-none select-none"
                         :style="getListPinStyle(item)">
                    </div>

                    <!-- ターゲットピン (案B: targetSpace選択時のみ表示) -->
                    <div v-if="targetSpace"
                         class="draggable-pin select-none flex items-center justify-center"
                         :style="{ left: (pinX * mapScale) + 'px', top: (pinY * mapScale) + 'px' }"
                         @mousedown.stop="startDrag"
                         @touchstart.stop="startDrag">
                      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-gray-900/95 text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-md border border-white/20 pointer-events-none">
                        {{ targetSpace }}
                      </div>
                      <span class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 rounded-full bg-rose-500/40 ring-2 ring-rose-600 animate-ping pointer-events-none"></span>
                      <span class="text-2xl leading-none relative z-10">📍</span>
                    </div>
                  </div>
                </div>

                <!-- ★ マップ選択中サークルのクイックアクションバー (スマホ: マップ下部オーバーレイ固定でガタつき防止) -->
                <div v-if="focusedMapCircle" class="absolute bottom-2 inset-x-2 z-20 bg-slate-900/95 backdrop-blur-xs text-white rounded-xl p-2 shadow-lg flex items-center justify-between gap-1.5 border border-slate-700">
                  <div class="flex items-center gap-1.5 min-w-0 flex-1">
                    <div v-if="spaceOrderedListPins.length > 1" class="flex items-center gap-0.5 shrink-0">
                      <button @click="stepMapPin(-1)" class="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold">◀</button>
                      <button @click="stepMapPin(1)" class="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold">▶</button>
                    </div>
                    <span class="px-1.5 py-0.5 rounded text-xs font-extrabold shrink-0" :class="getFocusedPinBadgeClass(focusedMapCircle.circle_id)">
                      {{ focusedMapCircle.space_sym }}-{{ focusedMapCircle.space_num }}
                    </span>
                    <div class="min-w-0 flex-1">
                      <div class="text-xs font-extrabold truncate">{{ focusedMapCircle.circle_name }}</div>
                      <div v-if="savedList[focusedMapCircle.circle_id]" class="text-[10px] text-slate-300 truncate flex items-center gap-1.5">
                        <span v-if="savedList[focusedMapCircle.circle_id].priority">優先:{{ savedList[focusedMapCircle.circle_id].priority }}</span>
                        <span v-if="savedList[focusedMapCircle.circle_id].price">¥{{ Number(savedList[focusedMapCircle.circle_id].price).toLocaleString() }}</span>
                        <span v-if="savedList[focusedMapCircle.circle_id].memo" class="text-amber-300 truncate">📝{{ savedList[focusedMapCircle.circle_id].memo }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    <button @click="openDetails(focusedMapCircle)"
                            class="px-2.5 py-1.5 bg-amber-400 active:bg-amber-300 text-slate-950 rounded-lg text-xs font-extrabold flex items-center gap-1">
                      <span>📸</span>
                      <span>詳細</span>
                    </button>
                    <button v-if="!isReadOnly && savedList[focusedMapCircle.circle_id]"
                            @click="toggleBought(focusedMapCircle.circle_id)"
                            class="px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 border"
                            :class="savedList[focusedMapCircle.circle_id].bought ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-800 active:bg-slate-700 text-white border-slate-600'">
                      <span>{{ savedList[focusedMapCircle.circle_id].bought ? '✓済' : '🛒済' }}</span>
                    </button>
                    <button @click="clearMapFocus" class="w-6 h-6 rounded-full text-slate-400 flex items-center justify-center text-sm">×</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-200/80">
              <div class="flex justify-between items-center mb-2.5">
                <h2 class="text-xs font-extrabold text-gray-700">🧭 配置ブロックで位置確認＆絞り込み</h2>
                <button v-if="filterBlock" @click="activeTab = 'search'" class="text-[11px] font-bold text-blue-600 hover:underline">
                  🔍 {{ filterBlock }}のサークル一覧を見る →
                </button>
                <span v-else class="text-[10px] text-gray-400">タップでマップ位置表示</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button v-for="block in blocks" :key="block" @click="selectBlockAndFocusMap(block)"
                        class="min-w-[44px] min-h-[42px] px-3 py-1.5 rounded-xl text-sm font-extrabold transition-all active:scale-95"
                        :class="filterBlock === block ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300' : 'bg-gray-50 text-gray-700 border border-gray-200'">
                  {{ block }}
                </button>
              </div>
            </div>
          </div>

          <!-- =========================================
               探す (検索) タブ
          ========================================== -->
          <div v-show="activeTab === 'search'" class="flex flex-col min-h-full pb-20 md:pb-8">
            <div class="p-2.5 md:p-3.5 bg-gray-50/95 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 shadow-xs">
              <!-- 検索入力ボックス -->
              <div class="relative shadow-xs rounded-xl overflow-hidden bg-white border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input ref="searchInputRef" type="text" v-model="searchQuery" placeholder="サークル名、ペンネーム、商品名、配置(A-01)で検索..." 
                       class="w-full pl-9 pr-14 py-2 text-base md:text-sm text-gray-900 placeholder-gray-400 focus:outline-none">
                
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                  <kbd v-if="!searchQuery" class="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-200 rounded">/</kbd>
                  <button v-if="searchQuery" @click="searchQuery = ''" class="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer" title="クリア">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </div>

              <!-- 検索結果件数 ＆ クイック絞り込みバー -->
              <div class="mt-2 flex items-center justify-between gap-1.5 px-0.5 flex-wrap">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-xs font-extrabold text-gray-700">
                    全 <span class="text-blue-600 font-mono text-sm">{{ filteredCircles.length }}</span> 件
                  </span>

                  <!-- 選択中のフィルターチップ（パネルを閉じていても一目で分かりワンタップ解除可能） -->
                  <button v-if="filterBlock" @click="selectBlockAndFocusMap(filterBlock, false)"
                          class="text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-blue-200 transition cursor-pointer">
                    <span>📍 {{ filterBlock }}</span>
                    <span>×</span>
                  </button>
                  <button v-if="filterMember" @click="filterMember = ''"
                          class="text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 hover:opacity-80 transition cursor-pointer"
                          :style="getMemberStyle(filterMember)">
                    <span>{{ getMemberMark(filterMember) }}{{ filterMember }}</span>
                    <span>×</span>
                  </button>
                  <button v-if="filterItemTag" @click="filterItemTag = ''"
                          class="text-[11px] font-bold bg-gray-800 text-white px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-gray-700 transition cursor-pointer">
                    <span>#{{ filterItemTag }}</span>
                    <span>×</span>
                  </button>

                  <button v-if="searchQuery || filterBlock || filterMember || filterItemTag || filterHasOshinagaki"
                          @click="resetAllFilters"
                          class="text-[11px] font-bold text-rose-600 hover:underline px-1 py-0.5 cursor-pointer">
                    クリア
                  </button>
                </div>

                <div class="flex items-center gap-1.5 ml-auto">
                  <!-- お品書き公開済みのみ 絞り込みトグル -->
                  <label class="flex items-center gap-1 cursor-pointer text-xs font-bold transition select-none px-2.5 py-1 rounded-xl border shadow-xs shrink-0"
                         :class="filterHasOshinagaki ? 'bg-amber-100 border-amber-400 text-amber-950 ring-1 ring-amber-300' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'">
                    <input type="checkbox" v-model="filterHasOshinagaki" class="accent-amber-600 w-3.5 h-3.5">
                    <span>📸 お品書き有</span>
                  </label>

                  <!-- フィルター開閉トグル -->
                  <button @click="showSearchFilters = !showSearchFilters"
                          class="px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1 shadow-xs cursor-pointer"
                          :class="(showSearchFilters || filterBlock || filterMember || filterItemTag) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'">
                    <span>🌪️ 絞り込み</span>
                    <svg class="w-3.5 h-3.5 transition-transform duration-200" :class="showSearchFilters ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                </div>
              </div>
              
              <!-- ★ 絞り込みフィルター群 (ブロック / メンバー / タグ クロス検索対応) -->
              <div v-show="showSearchFilters" class="mt-2 pt-2 border-t border-gray-200/80 space-y-1.5 px-0.5">
                <!-- ブロック横スクロール -->
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-bold text-gray-500 w-12 shrink-0">配置</span>
                  <div class="flex gap-1 overflow-x-auto pb-1 custom-scrollbar flex-1">
                    <button @click="filterBlock = ''; targetSpace = null" class="px-2 py-0.5 text-xs font-bold rounded-lg whitespace-nowrap transition cursor-pointer" :class="!filterBlock ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'">すべて</button>
                    <button v-for="b in blocks" :key="'sb_'+b" @click="selectBlockAndFocusMap(b, false)"
                            class="min-w-[30px] px-2 py-0.5 text-xs font-extrabold rounded-lg whitespace-nowrap border transition cursor-pointer"
                            :class="filterBlock === b ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'">
                      {{ b }}
                    </button>
                  </div>
                </div>

                <!-- メンバー横スクロール -->
                <div v-if="availableTags.members.length" class="flex items-center gap-2">
                  <span class="text-[11px] font-bold text-gray-500 w-12 shrink-0">メンバー</span>
                  <div class="flex gap-1 overflow-x-auto pb-1 custom-scrollbar flex-1">
                    <button @click="filterMember = ''" class="px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap transition cursor-pointer" :class="!filterMember ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'">すべて</button>
                    <button v-for="m in availableTags.members" :key="'fm_'+m" @click="filterMember = filterMember === m ? '' : m" class="px-2.5 py-0.5 text-xs font-bold rounded-full whitespace-nowrap border flex items-center gap-1 transition cursor-pointer" :style="filterMember === m ? getMemberStyle(m) : {}" :class="filterMember !== m ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'opacity-100 ring-2 ring-offset-1 ring-gray-400'">
                      <span>{{ getMemberMark(m) }}</span>
                      <span>{{ m }}</span>
                    </button>
                  </div>
                </div>

                <!-- タグ横スクロール -->
                <div v-if="availableTags.tags.length" class="flex items-center gap-2">
                  <span class="text-[11px] font-bold text-gray-500 w-12 shrink-0">タグ</span>
                  <div class="flex gap-1 overflow-x-auto pb-1 custom-scrollbar flex-1">
                    <button @click="filterItemTag = ''" class="px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap transition cursor-pointer" :class="!filterItemTag ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'">すべて</button>
                    <button v-for="t in availableTags.tags" :key="'ft_'+t" @click="filterItemTag = filterItemTag === t ? '' : t" class="px-2.5 py-0.5 text-xs font-bold rounded-full whitespace-nowrap border transition cursor-pointer" :class="filterItemTag === t ? 'bg-blue-100 border-blue-400 text-blue-900 ring-2 ring-offset-1 ring-blue-200' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'">
                      {{ t }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 検索結果 0件時のエンプティステート -->
            <div v-if="filteredCircles.length === 0" class="p-10 text-center my-6">
              <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🔍</div>
              <p class="font-bold text-gray-700 text-sm mb-1">条件に一致するサークルが見つかりませんでした</p>
              <p class="text-xs text-gray-500 mb-4">検索ワードや絞り込み条件を変更してみてください</p>
              <button @click="resetAllFilters" class="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow hover:bg-blue-700 transition cursor-pointer">
                すべての絞り込みを解除
              </button>
            </div>

            <!-- 検索タブのサークル一覧 (一覧性と視認性を両立したコンパクト3段カード) -->
            <ul v-else class="px-2.5 md:px-4 mt-2.5 grid grid-cols-1 xl:grid-cols-2 gap-2.5">
              <li v-for="circle in filteredCircles" :key="circle.circle_id" 
                  class="p-3 md:p-3.5 rounded-2xl shadow-xs border relative transition-all hover:shadow-md flex flex-col justify-between"
                  :class="[
                    isCircleAbsent(circle.circle_id) ? 'bg-rose-50/40 border-rose-200' : 
                    savedList[circle.circle_id] ? 'bg-white border-pink-300 ring-1 ring-pink-100' : 'bg-white border-gray-200/90'
                  ]">
                
                <!-- 買い物リスト追加/削除ボタン (44x44px タッチターゲット確保) -->
                <button v-if="!isReadOnly" @click="toggleSave(circle.circle_id)" 
                        :title="savedList[circle.circle_id] ? '買い物リストから外す' : '買い物リストに追加'"
                        class="absolute top-3 right-3 w-11 h-11 rounded-full transition-all active:scale-90 flex items-center justify-center z-10 cursor-pointer"
                        :class="savedList[circle.circle_id] ? 'bg-pink-500 text-white shadow-md hover:bg-pink-600 ring-2 ring-pink-200' : 'bg-gray-100 text-gray-500 hover:bg-pink-50 hover:text-pink-600 border border-gray-200'">
                  <svg class="h-5 w-5" :fill="savedList[circle.circle_id] ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path v-if="!savedList[circle.circle_id]" stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>

                <div class="flex flex-col gap-2 pr-12">
                  <!-- 【第1段】配置番号・ステータスバッジ -->
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <button @click="jumpToMap(circle)"
                            title="タップして会場マップで位置を確認"
                            class="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-extrabold rounded-lg shadow-xs border transition active:scale-95 cursor-pointer"
                            :class="isCircleAbsent(circle.circle_id) ? 'bg-rose-100 text-rose-800 border-rose-300 line-through' : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'">
                      <span>📍</span>
                      <span>{{ circle.space_sym }}-{{ circle.space_num }}</span>
                    </button>

                    <span v-if="isCircleAbsent(circle.circle_id)" class="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-600 text-white text-[11px] font-bold rounded-md shadow-xs">
                      <span>🚫 当日不参加</span>
                    </span>

                    <span v-if="savedList[circle.circle_id]" class="inline-flex items-center gap-0.5 px-2 py-0.5 bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-extrabold rounded-md">
                      <span>♥ リスト済</span>
                    </span>

                    <span v-if="circleExtraInfo[circle.circle_id]?.items?.length" class="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span>📦 {{ circleExtraInfo[circle.circle_id].items.length }}品</span>
                    </span>

                    <!-- 検索ワードに合致した商品名がある場合 -->
                    <span v-if="searchQuery.trim() && getMatchedItemNames(circle.circle_id, searchQuery).length" class="text-[10px] font-bold bg-pink-100 text-pink-800 border border-pink-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span>🎯「{{ getMatchedItemNames(circle.circle_id, searchQuery)[0] }}」</span>
                      <span v-if="getMatchedItemNames(circle.circle_id, searchQuery).length > 1" class="text-[9px] text-pink-600">+{{ getMatchedItemNames(circle.circle_id, searchQuery).length - 1 }}</span>
                    </span>
                  </div>

                  <!-- 【第2段】サークル名・代表者 ＆ Xリンク (1行にまとめて縦伸びを防止) -->
                  <div>
                    <h3 @click="openDetails(circle)" class="font-extrabold text-base md:text-lg leading-snug hover:text-blue-600 transition-colors cursor-pointer"
                        :class="isCircleAbsent(circle.circle_id) ? 'text-gray-400 line-through decoration-rose-400' : 'text-gray-900'">
                      {{ circle.circle_name }}
                    </h3>
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      <span class="text-xs text-gray-600 font-medium">代表: {{ circle.penname }}</span>

                      <!-- サークル主 ＆ 売り子 Xリンク -->
                      <a v-for="acc in getCircleAuthorAccounts(circle, circleExtraInfo[circle.circle_id])" :key="'srch_au_'+circle.circle_id+'_'+acc.handle"
                         :href="`https://x.com/${acc.handle}`" target="_blank" @click.stop
                         class="inline-flex items-center gap-1 text-[11px] bg-gray-900 hover:bg-gray-700 text-white px-2 py-0.5 rounded-md font-bold transition shadow-xs active:scale-95"
                         :title="acc.name ? `サークル主: ${acc.name} (@${acc.handle})` : `サークル主: @${acc.handle}`">
                        <svg class="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        <span class="truncate max-w-[130px]">{{ acc.name || ('@' + acc.handle) }}</span>
                      </a>

                      <a v-for="acc in getCircleStaffAccounts(circleExtraInfo[circle.circle_id])" :key="'srch_st_'+circle.circle_id+'_'+acc.handle"
                         :href="`https://x.com/${acc.handle}`" target="_blank" @click.stop
                         class="inline-flex items-center gap-1 text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-md font-bold transition shadow-xs active:scale-95"
                         :title="acc.name ? `売り子: ${acc.name} (@${acc.handle})` : `売り子: @${acc.handle}`">
                        <span class="shrink-0">🤝</span>
                        <span class="truncate max-w-[130px]">{{ acc.name || ('@' + acc.handle) }}</span>
                      </a>
                    </div>
                  </div>

                  <!-- メンバー ＆ 頒布物タグ -->
                  <div v-if="circleExtraInfo[circle.circle_id]?.members?.length || circleExtraInfo[circle.circle_id]?.tags?.length" class="flex flex-wrap gap-1">
                    <span v-for="member in (circleExtraInfo[circle.circle_id]?.members || [])" :key="'m_'+member" 
                          @click="filterMember = filterMember === member ? '' : member"
                          class="px-2 py-0.5 text-[11px] font-bold rounded-md border shadow-xs flex items-center gap-1 cursor-pointer hover:opacity-80 transition" 
                          :style="getMemberStyle(member)">
                      <span>{{ getMemberMark(member) }}</span>
                      <span>{{ member }}</span>
                    </span>
                    <span v-for="tag in (circleExtraInfo[circle.circle_id]?.tags || [])" :key="tag"
                          @click="filterItemTag = filterItemTag === tag ? '' : tag"
                          class="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-md border border-gray-200 cursor-pointer transition">
                      #{{ tag }}
                    </span>
                  </div>
                </div>

                <!-- 【第3段】下部アクションバー（お品書き有無がパッと見で判別できるメリハリ設計） -->
                <div class="flex items-center gap-2 mt-2.5 pt-2 border-t border-gray-100">
                  <button @click="openDetails(circle)"
                          class="flex-1 min-h-[36px] flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-extrabold transition active:scale-95 cursor-pointer"
                          :class="(circleExtraInfo[circle.circle_id]?.oshinagaki_url || circleExtraInfo[circle.circle_id]?.items?.length)
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'">
                    <span v-if="circleExtraInfo[circle.circle_id]?.oshinagaki_url || circleExtraInfo[circle.circle_id]?.items?.length">📸 お品書き・頒布物を見る</span>
                    <span v-else>📄 詳細・関連サークル</span>
                  </button>

                  <!-- 公式速報ボタン -->
                  <a :href="getCircleOfficialSearchUrl(circle, circleExtraInfo[circle.circle_id])" target="_blank"
                     class="min-h-[36px] flex items-center justify-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 px-3 py-1.5 rounded-xl font-bold border border-blue-200 transition active:scale-95"
                     title="サークル主・売り子の最新ツイートから完売・在庫・お品書き情報を検索">
                    <span class="text-amber-500">⚡</span>
                    <span>公式速報</span>
                  </a>
                </div>
              </li>
            </ul>
          </div>

          <!-- =========================================
               リスト タブ (買い物リスト・予算・優先度)
          ========================================== -->
          <div v-show="activeTab === 'list'" class="flex flex-col min-h-full pb-24 md:pb-8 relative">
            
            <div class="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md p-2.5 md:p-3.5 border-b border-gray-200 shadow-sm space-y-2">
              <!-- 達成度プログレスバー ＆ スリムヘッダー切替 -->
              <div v-if="savedCount > 0">
                <div class="flex justify-between items-center mb-1 px-0.5 gap-2">
                  <span class="text-xs font-extrabold text-gray-700 flex items-center gap-1 shrink-0">
                    <span>🎯 達成度</span>
                    <span class="text-blue-700 font-mono ml-0.5">{{ boughtCount }}/{{ activeTargetCount }}<span class="text-gray-500 text-[10px] font-sans">件</span> ({{ progressPercent }}%)</span>
                    <span v-if="soldoutCount > 0" class="text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
                      💔{{ soldoutCount }}
                    </span>
                  </span>

                  <div class="flex items-center gap-1.5">
                    <!-- スリムヘッダー時はここに金額サマリーを表示 -->
                    <span v-if="isListHeaderSlim" class="text-[11px] font-extrabold text-pink-800 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-md font-mono">
                      済:¥{{ spentPrice.toLocaleString() }} / 予:¥{{ totalPrice.toLocaleString() }}
                    </span>
                    <button @click="isListHeaderSlim = !isListHeaderSlim"
                            class="text-[10px] font-bold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-2 py-0.5 rounded-lg flex items-center gap-0.5 cursor-pointer shadow-2xs"
                            :title="isListHeaderSlim ? '予算・シェア・速報パネルを展開' : 'ヘッダーをスリムに折りたたむ'">
                      <span>{{ isListHeaderSlim ? '▼ 予算・速報' : '▲ スリム化' }}</span>
                    </button>
                  </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                  <div class="bg-gradient-to-r from-blue-500 to-pink-500 h-2 rounded-full transition-all duration-500 ease-out" :style="{ width: progressPercent + '%' }"></div>
                </div>
              </div>

              <!-- ツールバー ＆ 予算サマリー -->
              <div class="bg-white rounded-2xl shadow-xs border border-gray-200/90 p-2 md:p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <!-- 左側: ソート ＆ 未購入フィルタ ＆ 当日コンパクト表示トグル -->
                <div class="flex items-center justify-between sm:justify-start gap-1.5 flex-wrap">
                  <div class="flex items-center gap-1">
                    <span class="text-[11px] font-bold text-gray-500 hidden sm:inline">並び:</span>
                    <select v-model="sortOrder" class="h-8 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-2 outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 cursor-pointer">
                      <option value="default">追加順</option>
                      <option value="space">配置順 (A→N)</option>
                      <option value="priority">優先度順 (S→B)</option>
                    </select>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <label class="h-8 flex items-center gap-1 cursor-pointer text-xs font-bold transition-colors px-2.5 rounded-xl border select-none"
                           :class="hideBought ? 'bg-pink-100 border-pink-300 text-pink-900 ring-1 ring-pink-200' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'">
                      <input type="checkbox" v-model="hideBought" class="accent-pink-600 w-3.5 h-3.5">
                      <span>未購入のみ</span>
                    </label>

                    <!-- ★ 当日買い回り用 コンパクト表示モード切替 -->
                    <button @click="toggleListCompactMode"
                            type="button"
                            class="h-8 px-2.5 rounded-xl text-xs font-extrabold border transition flex items-center gap-1 cursor-pointer select-none shadow-2xs"
                            :class="isListCompactMode ? 'bg-slate-800 text-white border-slate-900 ring-2 ring-slate-300' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'"
                            title="入力欄をたたんで1画面に多くのサークルを表示する当日買い回り向けモード">
                      <span>🏃</span>
                      <span>コンパクト{{ isListCompactMode ? ':ON' : '' }}</span>
                    </button>
                  </div>
                </div>

                <!-- 右側: 予算・金額・シェア操作 (スリム化OFF時のみ表示) -->
                <div v-show="!isListHeaderSlim" class="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div class="flex flex-col items-start sm:items-end gap-0.5">
                    <div class="flex items-center flex-wrap gap-1.5">
                      <button type="button" class="text-[11px] font-bold text-gray-700 hover:text-blue-700 transition flex items-center gap-1 bg-gray-100 hover:bg-blue-50 px-2 py-0.5 rounded-lg border border-gray-200 cursor-pointer" @click="openBudgetModal" title="予算を設定する">
                        <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span>予算: {{ budgetAmount > 0 ? '¥' + budgetAmount.toLocaleString() : '設定' }}</span>
                      </button>
                      <span class="text-[11px] font-bold text-gray-600 font-mono">
                        予定: ¥{{ totalPrice.toLocaleString() }}
                      </span>
                      <span v-if="soldoutSavings > 0" class="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5" title="完売・スキップにより浮いた金額">
                        <span>💔 浮き +¥{{ soldoutSavings.toLocaleString() }}</span>
                      </span>
                    </div>
                    <div class="text-xs sm:text-sm font-extrabold bg-pink-50 text-pink-900 px-2.5 py-1 rounded-lg border border-pink-200 flex items-center shadow-sm">
                      <span>購入済:</span>
                      <span class="text-sm sm:text-base font-mono ml-1">¥{{ spentPrice.toLocaleString() }}</span>
                      <span v-if="budgetAmount > 0" class="text-[11px] font-mono ml-2 pl-2 border-l border-pink-200" :class="remainingBudget < 0 ? 'text-red-600 font-black' : 'text-pink-700 font-bold'">
                        残: ¥{{ remainingBudget.toLocaleString() }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <button @click="shareToTwitter" class="w-9 h-9 bg-gray-900 text-white rounded-xl hover:bg-gray-700 active:scale-95 transition flex items-center justify-center shadow-sm cursor-pointer" title="X (Twitter) でシェア">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </button>
                    <button @click="exportToText" class="w-9 h-9 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-100 active:scale-95 transition flex items-center justify-center shadow-sm cursor-pointer" title="テキストでクリップボードにコピー">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- ★ 会場Xリアルタイム速報チップ (スマホ用・スリム化OFF時のみ表示) -->
              <div v-show="!isListHeaderSlim" class="md:hidden flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs custom-scrollbar">
                <span class="text-[10px] font-bold text-gray-600 shrink-0 flex items-center gap-1">
                  <span class="text-amber-500 font-black">⚡</span>会場速報:
                </span>
                <a :href="getEventLiveSearchUrl('soldout')" target="_blank" 
                   class="shrink-0 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition">
                  <span>💔 完売情報</span>
                </a>
                <a :href="getEventLiveSearchUrl('line')" target="_blank" 
                   class="shrink-0 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition">
                  <span>🚶 列・最後尾</span>
                </a>
                <a :href="getEventLiveSearchUrl('all')" target="_blank" 
                   class="shrink-0 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition">
                  <span>📢 #VGGC12th 最新</span>
                </a>
              </div>
            </div>

            <!-- リスト本体 -->
            <div class="p-2.5 md:p-4">
              <div v-if="sortedSavedCircles.length === 0" class="flex-1 flex flex-col items-center justify-center p-8 text-center mt-8 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
                <div class="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-3 text-2xl">📝</div>
                <p class="font-extrabold text-gray-700 mb-1">表示するサークルがありません</p>
                <p v-if="hideBought && savedCount > 0" class="text-xs text-gray-500 mt-1 mb-3">（「未購入のみ」フィルターがオンになっています）</p>
                <p v-else class="text-xs text-gray-500 mt-1 mb-4">「探す」タブから気になるサークルの「＋」ボタンを押して追加しましょう！</p>
                <button v-if="hideBought && savedCount > 0" @click="hideBought = false" class="px-4 py-2 bg-pink-500 text-white text-xs font-bold rounded-xl shadow hover:bg-pink-600 transition">
                  購入済・完売サークルも表示する
                </button>
                <button v-else @click="activeTab = 'search'" class="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow hover:bg-blue-700 transition">
                  🔍 サークルを探しに行く
                </button>
              </div>
              
              <ul v-else class="grid grid-cols-1 xl:grid-cols-2" :class="isListCompactMode ? 'gap-2' : 'gap-3.5'">
                <li v-for="circle in sortedSavedCircles" :key="circle.circle_id" 
                    class="rounded-2xl shadow-sm border overflow-hidden relative transition-all duration-200 flex flex-col justify-between" 
                    :class="[
                      savedList[circle.circle_id].bought ? 'opacity-65 bg-gray-50 border-gray-200' : 
                      savedList[circle.circle_id].soldout ? 'opacity-70 bg-gray-100/90 border-dashed border-gray-300' : 
                      isCircleAbsent(circle.circle_id) ? 'bg-rose-50/50 border-rose-300' : 'bg-white border-gray-200/90 hover:border-pink-300'
                    ]">

                  <!-- =========================================================
                       ★ パターンA: 当日コンパクト表示モード (1画面に多数収まる高密度・誤タップ防止設計)
                  ========================================================== -->
                  <div v-if="isListCompactMode && expandedCompactCircleId !== circle.circle_id" class="p-3 flex flex-col gap-2">
                    <!-- 上段: 配置・優先度・サークル名・予定額・操作アイコン -->
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                        <button @click="jumpToMap(circle)"
                                title="タップして会場マップで位置を確認"
                                class="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-extrabold rounded-lg border shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
                                :class="isCircleAbsent(circle.circle_id) ? 'bg-rose-100 text-rose-800 border-rose-300 line-through' : 'bg-pink-600 text-white border-pink-700'">
                          <span>📍{{ circle.space_sym }}-{{ circle.space_num }}</span>
                        </button>

                        <!-- 優先度バッジ -->
                        <span v-if="savedList[circle.circle_id].priority"
                              class="px-1.5 py-0.5 text-[10px] font-extrabold rounded border shrink-0"
                              :class="{
                                'bg-red-500 text-white border-red-600': savedList[circle.circle_id].priority === 'S',
                                'bg-yellow-400 text-slate-950 border-yellow-500': savedList[circle.circle_id].priority === 'A',
                                'bg-blue-600 text-white border-blue-700': savedList[circle.circle_id].priority === 'B'
                              }">
                          優先:{{ savedList[circle.circle_id].priority }}
                        </span>

                        <h3 @click="openDetails(circle)" class="font-extrabold text-sm md:text-base leading-tight hover:text-pink-600 transition-colors cursor-pointer truncate max-w-full"
                            :class="isCircleAbsent(circle.circle_id) ? 'text-gray-400 line-through decoration-rose-400' : 'text-gray-900'">
                          {{ circle.circle_name }}
                        </h3>
                      </div>

                      <!-- 右上: 予定額 ＆ 個別編集展開ボタン -->
                      <div class="flex items-center gap-1 shrink-0">
                        <span v-if="savedList[circle.circle_id].price" class="px-2 py-0.5 bg-pink-50 text-pink-900 border border-pink-200 rounded-lg text-xs font-mono font-extrabold">
                          ¥{{ Number(savedList[circle.circle_id].price).toLocaleString() }}
                        </span>
                        <span v-if="savedList[circle.circle_id].forWho" class="px-1.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-[10px] font-bold">
                          {{ savedList[circle.circle_id].forWho }}
                        </span>
                        <button @click="expandedCompactCircleId = circle.circle_id"
                                class="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold transition cursor-pointer"
                                title="メモや金額・優先度を編集する">
                          ✏️
                        </button>
                      </div>
                    </div>

                    <!-- 中段: 選択した頒布物 ＆ メモ表示 (ある場合のみ) -->
                    <div v-if="savedList[circle.circle_id].selectedItems?.length || savedList[circle.circle_id].memo"
                         class="flex flex-wrap items-center gap-1.5 text-xs bg-amber-50/60 border border-amber-200/80 rounded-xl px-2.5 py-1.5">
                      <span v-for="itName in (savedList[circle.circle_id].selectedItems || [])" :key="'cmp_it_'+itName"
                            class="bg-white text-amber-950 border border-amber-300 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-0.5">
                        <span class="text-amber-600 font-black">✓</span>{{ itName }}
                      </span>
                      <span v-if="savedList[circle.circle_id].memo" class="text-gray-800 text-[11px] font-medium break-all">
                        📝 {{ savedList[circle.circle_id].memo }}
                      </span>
                    </div>

                    <!-- 下段: お品書き確認 ＆ 購入済・完売 ワンタップバー -->
                    <div class="grid grid-cols-12 gap-1.5 pt-0.5">
                      <button @click="openDetails(circle)"
                              class="col-span-4 min-h-[38px] px-2 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition active:scale-95 cursor-pointer"
                              :class="(circleExtraInfo[circle.circle_id]?.oshinagaki_url || circleExtraInfo[circle.circle_id]?.items?.length)
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'">
                        <span>📸</span>
                        <span class="truncate">{{ (circleExtraInfo[circle.circle_id]?.oshinagaki_url || circleExtraInfo[circle.circle_id]?.items?.length) ? 'お品書き' : '詳細' }}</span>
                      </button>

                      <template v-if="!isReadOnly">
                        <button @click="toggleBought(circle.circle_id)"
                                class="col-span-5 min-h-[38px] px-2 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1 border select-none cursor-pointer"
                                :class="savedList[circle.circle_id].bought 
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400' 
                                  : 'bg-pink-600 text-white border-pink-700 shadow-xs hover:bg-pink-700 active:scale-95'">
                          <span>{{ savedList[circle.circle_id].bought ? '✓ 購入済' : '🛒 済にする' }}</span>
                        </button>

                        <button @click="toggleSoldout(circle.circle_id)"
                                class="col-span-3 min-h-[38px] px-1.5 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-0.5 border select-none cursor-pointer"
                                :class="savedList[circle.circle_id].soldout 
                                  ? 'bg-rose-100 text-rose-900 border-rose-400' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-rose-50'">
                          <span>💔</span>
                          <span class="truncate">{{ savedList[circle.circle_id].soldout ? '完売中' : '完売' }}</span>
                        </button>
                      </template>
                    </div>
                  </div>

                  <!-- =========================================================
                       ★ パターンB: 通常フル表示モード (またはコンパクト中の個別編集展開時)
                  ========================================================== -->
                  <template v-else>
                    <!-- リストから削除ボタン -->
                    <div class="absolute top-3 right-3 flex items-center gap-1 z-10">
                      <button v-if="isListCompactMode && expandedCompactCircleId === circle.circle_id"
                              @click="expandedCompactCircleId = null"
                              class="px-2.5 py-1 bg-slate-800 text-white text-[11px] font-bold rounded-lg shadow hover:bg-slate-700 cursor-pointer">
                        ▲ 編集完了
                      </button>
                      <button v-if="!isReadOnly" @click="toggleSave(circle.circle_id)" 
                              title="買い物リストから削除"
                              class="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>

                    <!-- 【第1段・第2段】サークル基本情報 ＆ 買うもの・リンク -->
                    <div class="p-3.5 md:p-4 flex flex-col gap-2.5 relative">
                      <!-- 配置番号とステータスバッジ -->
                      <div class="flex items-center gap-1.5 flex-wrap pr-16">
                        <button @click="jumpToMap(circle)"
                                title="タップして会場マップで位置を確認"
                                class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold rounded-lg border shadow-sm transition active:scale-95 cursor-pointer"
                                :class="isCircleAbsent(circle.circle_id) ? 'bg-rose-100 text-rose-800 border-rose-300 line-through' : 'bg-pink-600 text-white border-pink-700 hover:bg-pink-700'">
                          <span>📍</span>
                          <span>{{ circle.space_sym }}-{{ circle.space_num }}</span>
                        </button>

                        <span v-if="isCircleAbsent(circle.circle_id)" class="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-600 text-white text-xs font-bold rounded-md shadow-sm">
                          <span>🚫 当日不参加</span>
                        </span>
                        <span v-if="savedList[circle.circle_id].soldout" class="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-md border border-rose-300 shadow-sm">
                          💔 完売・スキップ
                        </span>
                        <span v-else-if="savedList[circle.circle_id].bought" class="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md border border-emerald-300 shadow-sm">
                          ✓ 購入済
                        </span>
                      </div>

                      <!-- サークル名・代表者 ＆ Xリンク -->
                      <div class="pr-6">
                        <h3 @click="openDetails(circle)" class="font-extrabold text-base md:text-lg leading-snug hover:text-pink-600 transition-colors cursor-pointer"
                            :class="isCircleAbsent(circle.circle_id) ? 'text-gray-400 line-through decoration-rose-400' : 'text-gray-900'">
                          {{ circle.circle_name }}
                        </h3>
                        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                          <span v-if="circle.penname" class="text-xs text-gray-600 font-medium">代表: {{ circle.penname }}</span>

                          <a v-for="acc in getCircleAuthorAccounts(circle, circleExtraInfo[circle.circle_id])" :key="'lst_au_'+circle.circle_id+'_'+acc.handle"
                             :href="`https://x.com/${acc.handle}`" target="_blank" @click.stop
                             class="inline-flex items-center gap-1 text-[11px] bg-gray-900 hover:bg-gray-700 text-white px-2 py-0.5 rounded-md font-bold transition shadow-xs active:scale-95"
                             :title="acc.name ? `サークル主: ${acc.name} (@${acc.handle})` : `サークル主: @${acc.handle}`">
                            <svg class="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            <span class="truncate max-w-[130px]">{{ acc.name || ('@' + acc.handle) }}</span>
                          </a>

                          <a v-for="acc in getCircleStaffAccounts(circleExtraInfo[circle.circle_id])" :key="'lst_st_'+circle.circle_id+'_'+acc.handle"
                             :href="`https://x.com/${acc.handle}`" target="_blank" @click.stop
                             class="inline-flex items-center gap-1 text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-md font-bold transition shadow-xs active:scale-95"
                             :title="acc.name ? `売り子: ${acc.name} (@${acc.handle})` : `売り子: @${acc.handle}`">
                            <span class="shrink-0">🤝</span>
                            <span class="truncate max-w-[130px]">{{ acc.name || ('@' + acc.handle) }}</span>
                          </a>
                        </div>
                      </div>

                      <!-- メンバータグ ＆ 頒布物タグ -->
                      <div v-if="circleExtraInfo[circle.circle_id]?.members?.length || circleExtraInfo[circle.circle_id]?.tags?.length" class="flex flex-wrap gap-1">
                        <span v-for="member in (circleExtraInfo[circle.circle_id]?.members || [])" :key="'m_'+member" class="px-2 py-0.5 text-[11px] font-bold rounded-md border shadow-xs flex items-center gap-0.5" :style="getMemberStyle(member)">
                          <span>{{ getMemberMark(member) }}</span>
                          <span>{{ member }}</span>
                        </span>
                        <span v-for="tag in (circleExtraInfo[circle.circle_id]?.tags || [])" :key="tag" class="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-md border border-gray-200">
                          #{{ tag }}
                        </span>
                      </div>

                      <!-- ★ 選択中のお品書き商品バッジ一覧 -->
                      <div v-if="savedList[circle.circle_id].selectedItems?.length" 
                           @click="openDetails(circle)"
                           class="mt-0.5 p-2.5 bg-amber-50/70 hover:bg-amber-50 border border-amber-200 rounded-xl cursor-pointer transition space-y-1.5">
                        <div class="text-[11px] font-extrabold text-amber-900 flex items-center justify-between">
                          <span>📦 選択中の頒布物 ({{ savedList[circle.circle_id].selectedItems.length }}点):</span>
                          <span class="text-[10px] text-amber-700 underline">変更する</span>
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                          <span v-for="itName in savedList[circle.circle_id].selectedItems" :key="itName" 
                                class="text-xs bg-white text-amber-950 border border-amber-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shadow-sm">
                            <span class="text-amber-600 font-black">✓</span>{{ itName }}
                          </span>
                        </div>
                      </div>

                      <!-- 情報確認ボタンバー（お品書き・公式速報・目撃/列：押しやすいサイズに統一） -->
                      <div class="grid grid-cols-3 gap-1.5 pt-1">
                        <button @click="openDetails(circle)"
                                class="min-h-[38px] flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-xl font-bold border transition shadow-sm active:scale-95 cursor-pointer"
                                :class="(circleExtraInfo[circle.circle_id]?.oshinagaki_url || circleExtraInfo[circle.circle_id]?.items?.length)
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'">
                          <span>📸</span>
                          <span class="truncate">{{ (circleExtraInfo[circle.circle_id]?.oshinagaki_url || circleExtraInfo[circle.circle_id]?.items?.length) ? 'お品書き' : '詳細/X' }}</span>
                        </button>

                        <a :href="getCircleOfficialSearchUrl(circle, circleExtraInfo[circle.circle_id])" target="_blank"
                           class="min-h-[38px] flex items-center justify-center gap-1 text-xs bg-blue-50 text-blue-800 hover:bg-blue-100 px-2 py-1.5 rounded-xl font-bold border border-blue-200 transition shadow-sm active:scale-95"
                           title="サークル主・売り子の最新ツイートから完売・在庫・列情報を検索">
                          <span class="text-amber-500">⚡</span>
                          <span class="truncate">公式速報</span>
                        </a>

                        <a :href="getCirclePublicSearchUrl(circle)" target="_blank"
                           class="min-h-[38px] flex items-center justify-center gap-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-2 py-1.5 rounded-xl font-bold border border-gray-200 transition shadow-sm active:scale-95"
                           title="参加者の目撃ツイートから完売や最後尾情報を検索">
                          <span>👥</span>
                          <span class="truncate">目撃/列</span>
                        </a>
                      </div>
                    </div>
                    
                    <!-- 【第3段】お買い物プラン入力 ＆ 現場ステータストグル (44pxタッチ対応) -->
                    <div class="bg-gray-50/90 p-3 md:p-3.5 border-t border-gray-200/80 flex flex-col gap-2.5">
                      <!-- 優先度・予算・誰用 (高コントラスト化) -->
                      <div class="grid grid-cols-12 gap-2">
                        <select v-model="savedList[circle.circle_id].priority" :disabled="isReadOnly" 
                                class="col-span-5 h-9 text-xs border border-gray-300 rounded-xl px-2 bg-white focus:ring-2 focus:ring-pink-400 outline-none font-bold cursor-pointer" 
                                :class="priorityColors[savedList[circle.circle_id].priority]">
                          <option value="">優先度: 未設定</option>
                          <option value="S">優先: S (最優先)</option>
                          <option value="A">優先: A (買いたい)</option>
                          <option value="B">優先: B (見に行く)</option>
                        </select>

                        <div class="col-span-4 h-9 flex items-center text-xs border border-gray-300 rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-pink-400">
                          <span class="pl-2.5 pr-1 text-gray-500 font-bold">¥</span>
                          <input type="number" v-model.number="savedList[circle.circle_id].price" :readonly="isReadOnly" placeholder="予定額" 
                                 class="w-full py-1 pr-2.5 bg-transparent outline-none text-right font-mono font-bold text-gray-900 placeholder-gray-400">
                        </div>

                        <input type="text" v-model="savedList[circle.circle_id].forWho" :readonly="isReadOnly" placeholder="誰用？" 
                               class="col-span-3 h-9 text-xs border border-gray-300 rounded-xl px-2.5 bg-white outline-none focus:ring-2 focus:ring-pink-400 text-gray-800 placeholder-gray-400 font-medium">
                      </div>

                      <!-- メモ欄 (屋外でも見やすいコントラスト) -->
                      <textarea v-model="savedList[circle.circle_id].memo" :readonly="isReadOnly" placeholder="メモを入力（例: 新刊セット、アクスタ、スケブお願いする）" 
                                class="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none h-12 bg-white text-gray-900 placeholder-gray-400 leading-snug"></textarea>
                      
                      <!-- 現場用大型アクションボタン: 購入済み & 完売 (高さ44px確保) -->
                      <div v-if="!isReadOnly" class="grid grid-cols-12 gap-2 pt-0.5">
                        <!-- 購入済みトグル (8カラム) -->
                        <button @click="toggleBought(circle.circle_id)"
                                class="col-span-8 min-h-[44px] py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 border select-none cursor-pointer"
                                :class="savedList[circle.circle_id].bought 
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-300/60 shadow-inner' 
                                  : 'bg-pink-600 text-white border-pink-700 shadow-sm hover:bg-pink-700 active:scale-95'">
                          <svg v-if="savedList[circle.circle_id].bought" class="w-4 h-4 text-emerald-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                          <svg v-else class="w-4 h-4 opacity-95 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                          <span class="truncate">{{ savedList[circle.circle_id].bought ? '✓ 購入済 (タップで戻す)' : '🛒 購入済みにする' }}</span>
                        </button>

                        <!-- 完売・スキップトグル (4カラム) -->
                        <button @click="toggleSoldout(circle.circle_id)"
                                class="col-span-4 min-h-[44px] py-2.5 px-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1 border select-none cursor-pointer"
                                :class="savedList[circle.circle_id].soldout 
                                  ? 'bg-rose-100 text-rose-900 border-rose-400 ring-2 ring-rose-300/60 shadow-inner' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 active:scale-95 shadow-sm'">
                          <span>💔</span>
                          <span class="truncate">{{ savedList[circle.circle_id].soldout ? '完売中' : '完売' }}</span>
                        </button>
                      </div>
                    </div>
                  </template>
                </li>
              </ul>
            </div>
          </div>

          <!-- =========================================
               フリーメモ タブ (即売会準備ダッシュボード)
          ========================================== -->
          <MemoDashboard 
            v-show="activeTab === 'memo'" 
            v-model:freeMemoText="freeMemoText" 
            :is-read-only="isReadOnly" 
            :currency-breakdown="currencyBreakdown" 
          />

        </div>
      </div>
    </div>

    <!-- スマホ専用ボトムナビゲーション (44px以上のタッチ領域確保) -->
    <div class="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 flex justify-around items-stretch pb-safe fixed bottom-0 w-full z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <button @click="activeTab = 'map'" class="flex-1 min-h-[54px] py-2 flex flex-col items-center justify-center gap-0.5 transition-colors relative cursor-pointer" :class="activeTab === 'map' ? 'text-blue-600 font-extrabold bg-blue-50/40' : 'text-gray-500 hover:text-gray-800'">
        <span v-if="activeTab === 'map'" class="absolute top-0 inset-x-4 h-0.5 bg-blue-600 rounded-b-full"></span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
        <span class="text-[11px] tracking-tight">マップ</span>
      </button>
      <button @click="activeTab = 'search'" class="flex-1 min-h-[54px] py-2 flex flex-col items-center justify-center gap-0.5 transition-colors relative cursor-pointer" :class="activeTab === 'search' ? 'text-blue-600 font-extrabold bg-blue-50/40' : 'text-gray-500 hover:text-gray-800'">
        <span v-if="activeTab === 'search'" class="absolute top-0 inset-x-4 h-0.5 bg-blue-600 rounded-b-full"></span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <span class="text-[11px] tracking-tight">探す</span>
      </button>
      <button @click="activeTab = 'list'" class="flex-1 min-h-[54px] py-2 flex flex-col items-center justify-center gap-0.5 transition-colors relative cursor-pointer" :class="activeTab === 'list' ? 'text-pink-600 font-extrabold bg-pink-50/40' : 'text-gray-500 hover:text-gray-800'">
        <span v-if="activeTab === 'list'" class="absolute top-0 inset-x-4 h-0.5 bg-pink-600 rounded-b-full"></span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
        <span class="text-[11px] tracking-tight">リスト</span>
        <span v-if="savedCount > 0" class="absolute top-1.5 right-3 bg-pink-600 text-white text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-extrabold shadow-xs">
          <span v-if="hideBought">{{ Math.max(0, activeTargetCount - boughtCount) }}</span>
          <span v-else>{{ savedCount }}</span>
        </span>
      </button>
      <button @click="activeTab = 'memo'" class="flex-1 min-h-[54px] py-2 flex flex-col items-center justify-center gap-0.5 transition-colors relative cursor-pointer" :class="activeTab === 'memo' ? 'text-emerald-600 font-extrabold bg-emerald-50/40' : 'text-gray-500 hover:text-gray-800'">
        <span v-if="activeTab === 'memo'" class="absolute top-0 inset-x-4 h-0.5 bg-emerald-600 rounded-b-full"></span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        <span class="text-[11px] tracking-tight">メモ・準備</span>
      </button>
    </div>

    <!-- 初回・ヘルプモーダル -->
    <HelpModal :show="showHelpModal" @close="showHelpModal = false" />

    <!-- ★サークル詳細 / お品書き モーダル (PC2カラム ＆ スマホタブ切り替え対応) -->
    <CircleDetailModal 
      :circle="selectedCircle" 
      :circle-extra-info="circleExtraInfo" 
      :saved-list="savedList" 
      :is-read-only="isReadOnly" 
      :related-circles="relatedCircles" 
      :is-tweet-loading="isTweetLoading" 
      :is-online="isOnline"
      @close="selectedCircle = null" 
      @toggle-save="toggleSave" 
      @toggle-bought="toggleBought"
      @toggle-soldout="toggleSoldout"
      @toggle-item="toggleItemSelection" 
      @open-circle="openDetails" 
      @jump-to-map="jumpToMap"
    />

    <!-- ★予算設定モーダル -->
    <BudgetModal 
      :show="showBudgetModal" 
      :initial-budget="savedList['__BUDGET__'] || ''" 
      @close="showBudgetModal = false" 
      @save="saveBudget" 
    />

    <!-- ログイン/登録モーダル -->
    <AuthModal :show="showAuthModal" :is-online="isOnline" @close="showAuthModal = false" />

    <!-- 共有モーダル -->
    <ShareModal :show="showShareModal" :is-public="isPublic" :share-url="shareUrl" @close="showShareModal = false" @toggle-public="onTogglePublic" />

  
</div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import mapCoordsData from './map_coords.json';
import { supabaseClient } from './supabase';
import { STORAGE_KEY, vspoDict, priorityColors } from './constants';
import { calculateCurrencyBreakdown } from './utils/currency';
import { getEventCountdown, checkScheduleActive } from './utils/countdown';
import { getMemberStyle, getMemberMark } from './utils/memberStyle';
import { getCircleOfficialSearchUrl, getCirclePublicSearchUrl, getEventLiveSearchUrl, getCircleAuthorTwitterIds, getCircleStaffTwitterIds, getCircleAuthorAccounts, getCircleStaffAccounts } from './utils/xSearch';

import BudgetModal from './components/BudgetModal.vue';
import MemoDashboard from './components/MemoDashboard.vue';
import CircleDetailModal from './components/CircleDetailModal.vue';
import HelpModal from './components/HelpModal.vue';
import AuthModal from './components/AuthModal.vue';
import ShareModal from './components/ShareModal.vue';
import EventCountdownBar from './components/EventCountdownBar.vue';

        const circles = ref([]);
        const blocks = ref([]);
        const loading = ref(true);
        const searchQuery = ref('');
        const filterBlock = ref('');
        const filterMember = ref('');
        const filterItemTag = ref('');
        const filterHasOshinagaki = ref(false);
        const showSearchFilters = ref(false);
        const searchInputRef = ref(null);
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
        const focusedMapCircle = ref(null);
        const showListPins = ref(true);
        const showCompletedPins = ref(false);
        const showPcBlockPanel = ref(true);
        const isListCompactMode = ref(localStorage.getItem('vggc12th_list_compact') === 'true');
        const expandedCompactCircleId = ref(null);
        const isListHeaderSlim = ref(false);
        const isPanningMap = ref(false);
        const mapCoords = ref((mapCoordsData && mapCoordsData.default) ? mapCoordsData.default : (mapCoordsData || {}));

        const toggleListCompactMode = () => {
          isListCompactMode.value = !isListCompactMode.value;
          expandedCompactCircleId.value = null;
          try {
            localStorage.setItem('vggc12th_list_compact', String(isListCompactMode.value));
          } catch (e) {}
        };

        const changeMapScale = (delta) => {
          const oldScale = mapScale.value;
          const newScale = Math.max(0.5, Math.min(2.5, +(oldScale + delta).toFixed(2)));
          if (newScale === oldScale) return;

          // 現在の表示中心座標を記録してズーム後も中心を維持する
          const containers = document.querySelectorAll('.map-container');
          const centers = [];
          containers.forEach(c => {
            if (c.clientWidth > 0) {
              centers.push({
                el: c,
                cx: (c.scrollLeft + c.clientWidth / 2) / oldScale,
                cy: (c.scrollTop + c.clientHeight / 2) / oldScale
              });
            }
          });

          mapScale.value = newScale;
          nextTick(() => {
            centers.forEach(({ el, cx, cy }) => {
              el.scrollLeft = Math.max(0, cx * newScale - el.clientWidth / 2);
              el.scrollTop = Math.max(0, cy * newScale - el.clientHeight / 2);
            });
          });
        };

        const handleMapWheel = (e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            changeMapScale(e.deltaY < 0 ? 0.15 : -0.15);
          }
        };

        let mapPanState = null;
        const startMapPan = (e) => {
          if (e.button !== 0 || isDraggingPin) return;
          const container = e.currentTarget;
          mapPanState = {
            container,
            startX: e.clientX,
            startY: e.clientY,
            scrollLeft: container.scrollLeft,
            scrollTop: container.scrollTop
          };
        };

        const moveMapPan = (e) => {
          if (!mapPanState || isDraggingPin) return;
          const dx = e.clientX - mapPanState.startX;
          const dy = e.clientY - mapPanState.startY;
          if (!isPanningMap.value && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
            isPanningMap.value = true;
          }
          if (isPanningMap.value) {
            e.preventDefault();
            mapPanState.container.scrollLeft = mapPanState.scrollLeft - dx;
            mapPanState.container.scrollTop = mapPanState.scrollTop - dy;
          }
        };

        const endMapPan = () => {
          mapPanState = null;
          isPanningMap.value = false;
        };

        const clearMapFocus = () => {
          targetSpace.value = null;
          focusedMapCircle.value = null;
        };

        const getCircleMapPos = (circle) => {
          if (!circle) return null;
          const spaceId = `${circle.space_sym}-${circle.space_num}`;
          if (mapCoords.value[spaceId]) return mapCoords.value[spaceId];
          if (circle.space_num && circle.space_num.includes('-')) {
            const baseSpace = `${circle.space_sym}-${circle.space_num.split('-')[0]}`;
            if (mapCoords.value[baseSpace]) return mapCoords.value[baseSpace];
          }
          if (mapCoords.value[circle.space_sym]) return mapCoords.value[circle.space_sym];
          return null;
        };

        const activeListMapPins = computed(() => {
          if (!showListPins.value) return [];
          const result = [];
          circles.value.forEach(c => {
            const saved = savedList.value[c.circle_id];
            if (!saved) return;
            const isCompleted = Boolean(saved.bought || saved.soldout || isCircleAbsent(c.circle_id));
            if (isCompleted && !showCompletedPins.value) return;
            const pos = getCircleMapPos(c);
            if (!pos) return;
            const priority = saved.priority || '';
            result.push({
              circle: c,
              circle_id: c.circle_id,
              spaceLabel: `${c.space_sym}-${c.space_num}`,
              x: pos.x,
              y: pos.y,
              priority,
              isCompleted
            });
          });
          // 描画順：完了済 -> 未設定 -> B -> A -> S の順にし、Sが必ず最前面に来るようにする
          const order = { '': 1, 'B': 2, 'A': 3, 'S': 4 };
          result.sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? -1 : 1;
            return (order[a.priority] || 0) - (order[b.priority] || 0);
          });
          return result;
        });

        // 配置順（A-01 -> N-40）でソートされたリストピンの配列（◀ ▶ 順送り用）
        const spaceOrderedListPins = computed(() => {
          return [...activeListMapPins.value].sort((a, b) => {
            if (a.circle.space_sym !== b.circle.space_sym) {
              return a.circle.space_sym.localeCompare(b.circle.space_sym);
            }
            return parseInt(a.circle.space_num) - parseInt(b.circle.space_num);
          });
        });

        const getListPinStyle = (item) => {
          const scale = mapScale.value;
          const isSelected = focusedMapCircle.value && focusedMapCircle.value.circle_id === item.circle_id;
          const isS = item.priority === 'S' && !item.isCompleted;
          const baseSize = item.isCompleted
            ? Math.max(4, Math.round(5 * scale))
            : isS
              ? Math.max(6, Math.round(7.5 * scale))
              : Math.max(5, Math.round(6 * scale));
          const size = isSelected ? baseSize + 3 : baseSize;

          let bg = '#10b981'; // 🟢 未設定: Emerald Green
          let ring = '#065f46';
          let zIndex = 5;
          let opacity = 1;

          if (item.isCompleted) {
            bg = '#94a3b8'; // ⚪ 購入済・完売: Slate Gray
            ring = '#475569';
            zIndex = 3;
            opacity = 0.65;
          } else if (item.priority === 'S') {
            bg = '#ef4444'; // 🔴 S: Vivid Red
            ring = '#991b1b';
            zIndex = 8;
          } else if (item.priority === 'A') {
            bg = '#facc15'; // 🟡 A: Vivid Yellow
            ring = '#854d0e';
            zIndex = 7;
          } else if (item.priority === 'B') {
            bg = '#2563eb'; // 🔵 B: Royal Blue
            ring = '#1e3a8a';
            zIndex = 6;
          }

          if (isSelected) {
            zIndex = 12;
          }

          return {
            left: (item.x * scale) + 'px',
            top: (item.y * scale) + 'px',
            width: size + 'px',
            height: size + 'px',
            backgroundColor: bg,
            opacity,
            boxShadow: isSelected
              ? `0 0 0 2px #ffffff, 0 0 0 4px #ec4899, 0 2px 4px rgba(0,0,0,0.5)`
              : `0 0 0 1px ${ring}, 0 1px 2px rgba(0,0,0,0.35)`,
            zIndex
          };
        };

        const getFocusedPinBadgeClass = (circleId) => {
          const saved = savedList.value[circleId];
          if (!saved) return 'bg-blue-600 text-white';
          if (saved.bought) return 'bg-emerald-600 text-white';
          if (saved.soldout) return 'bg-slate-600 text-slate-200 line-through';
          if (saved.priority === 'S') return 'bg-red-500 text-white';
          if (saved.priority === 'A') return 'bg-yellow-400 text-slate-950';
          if (saved.priority === 'B') return 'bg-blue-600 text-white';
          return 'bg-emerald-500 text-white';
        };

        // ★ Step 2: マップ上のドット近傍スナップ選択（指でのスクロールと誤タップを厳密に区別）
        let mapDownPos = { x: 0, y: 0 };
        const handleMapPointerDown = (e) => {
          const pt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
          mapDownPos = { x: pt.clientX, y: pt.clientY };
        };

        const focusMapPinItem = (item, shouldScroll = false) => {
          if (!item) return;
          focusedMapCircle.value = item.circle;
          pinX.value = item.x;
          pinY.value = item.y;
          targetSpace.value = `${item.spaceLabel} (${item.circle.circle_name})`;
          savePinPos();
          if (shouldScroll) {
            scrollMapToPin(item.x, item.y);
          }
        };

        const handleMapClick = (e) => {
          if (isDraggingPin) return;
          const dxMove = Math.abs(e.clientX - mapDownPos.x);
          const dyMove = Math.abs(e.clientY - mapDownPos.y);
          if (dxMove > 6 || dyMove > 6) return; // スクロールやドラッグ操作時は無視

          if (!activeListMapPins.value.length) return;

          const container = e.currentTarget;
          const rect = container.getBoundingClientRect();
          const mapX = (e.clientX - rect.left) / mapScale.value;
          const mapY = (e.clientY - rect.top) / mapScale.value;

          // 画面上で半径 18px 以内にあるドットを距離順に取得
          const maxMapDist = 18 / mapScale.value;
          const candidates = activeListMapPins.value
            .map(item => {
              const dist = Math.hypot(item.x - mapX, item.y - mapY);
              return { item, dist };
            })
            .filter(c => c.dist <= maxMapDist)
            .sort((a, b) => a.dist - b.dist);

          if (candidates.length === 0) return;

          // 同じ密集箇所を連続タップした場合は、近くにある次の候補へ順番に切り替えられるようにする
          let chosen = candidates[0].item;
          if (focusedMapCircle.value && candidates.length > 1) {
            const currentIdx = candidates.findIndex(c => c.item.circle_id === focusedMapCircle.value.circle_id);
            if (currentIdx !== -1) {
              chosen = candidates[(currentIdx + 1) % candidates.length].item;
            }
          }
          focusMapPinItem(chosen, false);
        };

        const stepMapPin = (dir) => {
          const list = spaceOrderedListPins.value;
          if (!list.length) return;
          const currentId = focusedMapCircle.value?.circle_id;
          const idx = list.findIndex(item => item.circle_id === currentId);
          const nextIdx = idx === -1 ? 0 : (idx + dir + list.length) % list.length;
          focusMapPinItem(list[nextIdx], true);
        };

        const resetAllFilters = () => {
          searchQuery.value = '';
          filterBlock.value = '';
          filterMember.value = '';
          filterItemTag.value = '';
          filterHasOshinagaki.value = false;
        };

        const scrollMapToPin = (x, y) => {
          setTimeout(() => {
            const containers = document.querySelectorAll('.map-container');
            containers.forEach(container => {
              if (container.clientWidth > 0) {
                const scrollX = (x * mapScale.value) - (container.clientWidth / 2);
                const scrollY = (y * mapScale.value) - (container.clientHeight / 2);
                container.scrollTo({
                  left: Math.max(0, scrollX),
                  top: Math.max(0, scrollY),
                  behavior: 'smooth'
                });
              }
            });
          }, 80);
        };

        const selectBlockAndFocusMap = (block, switchTabOnMobile = true) => {
          filterBlock.value = filterBlock.value === block ? '' : block;
          focusedMapCircle.value = null;
          if (window.innerWidth >= 768 && activeTab.value === 'map') {
            activeTab.value = 'search';
          }
          if (filterBlock.value && mapCoords.value[filterBlock.value]) {
            const pos = mapCoords.value[filterBlock.value];
            pinX.value = pos.x;
            pinY.value = pos.y;
            targetSpace.value = `ブロック ${filterBlock.value}`;
            savePinPos();
            scrollMapToPin(pos.x, pos.y);
          } else if (!filterBlock.value) {
            targetSpace.value = null;
          }
        };

        const jumpToMap = (circle) => {
          const spaceId = circle.space_sym + '-' + circle.space_num;
          targetSpace.value = spaceId + ' (' + circle.circle_name + ')';
          focusedMapCircle.value = circle;
          
          // モバイル表示のときのみマップタブへ切り替え（PCでは左ペインに常時マップがあるため現在のタブを維持）
          if (window.innerWidth < 768) {
            activeTab.value = 'map';
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          
          const targetPos = getCircleMapPos(circle);
          if (targetPos) {
            pinX.value = targetPos.x;
            pinY.value = targetPos.y;
            savePinPos();
            scrollMapToPin(targetPos.x, targetPos.y);
          }
        };

        const sortOrder = ref('default'); 
        const hideBought = ref(false);
        
        // ★ Supabaseから取得した追加情報（タグ・お品書きURL）を保持するステート
        const circleExtraInfo = ref({});
        
        // 詳細モーダルのステートと、X(Twitter)埋め込みの監視処理
        const selectedCircle = ref(null);
        
        // ★ 検索クエリに合致した商品名を取得
        const getMatchedItemNames = (circleId, query) => {
          const q = (query || '').trim().toLowerCase();
          if (!q) return [];
          const items = circleExtraInfo.value[circleId]?.items || [];
          return items
            .filter(it => it.name && it.name.toLowerCase().includes(q))
            .map(it => it.name);
        };

        // ★ イベント日時 & カウントダウン
        const currentTime = ref(new Date());
        setInterval(() => {
          currentTime.value = new Date();
        }, 60000);

        const eventCountdown = computed(() => getEventCountdown(currentTime.value));
        const isCurrentSchedule = (timeKey) => checkScheduleActive(timeKey, currentTime.value);

        // ★ 両替・金種計算 (買い物リストから自動逆算)
        const currencyBreakdown = computed(() => calculateCurrencyBreakdown(savedList.value));

        // ★ ログアウト確認付きハンドラ
        const handleSafeSignOut = async () => {
          if (confirm('ログアウトしてもよろしいですか？\n※会場など電波が弱い環境では再ログインに時間がかかる場合があります。')) {
            await supabaseClient.auth.signOut();
            user.value = null;
            location.reload();
          }
        };

        const toggleItemSelection = (circleId, item) => {
          if (isReadOnly.value) return;
          
          if (!savedList.value[circleId]) {
            savedList.value[circleId] = {
              memo: '',
              bought: false,
              price: '',
              priority: '',
              forWho: '',
              selectedItems: []
            };
          } else if (!savedList.value[circleId].selectedItems) {
            savedList.value[circleId].selectedItems = [];
          }

          const selectedList = savedList.value[circleId].selectedItems;
          const idx = selectedList.indexOf(item.name);
          if (idx > -1) {
            selectedList.splice(idx, 1);
          } else {
            selectedList.push(item.name);
          }

          // 金額の自動再計算
          const items = circleExtraInfo.value[circleId]?.items || [];
          const total = items
            .filter(it => selectedList.includes(it.name))
            .reduce((sum, it) => sum + (Number(it.price) || 0), 0);
          
          savedList.value[circleId].price = total > 0 ? total : '';
        };

        const openDetails = (circle) => {
          selectedCircle.value = circle;
        };

        watch(selectedCircle, async (newVal) => {
          if (newVal && circleExtraInfo.value[newVal.circle_id]?.oshinagaki_url) {
            const url = circleExtraInfo.value[newVal.circle_id].oshinagaki_url;
            // Pixiv作品URLの場合はCircleDetailModal内のネイティブPixivビューアで表示するためスキップ
            if (/(?:pixiv\.net\/(?:[a-z]{2}\/)?artworks\/|illust_id=)(\d+)/i.test(url)) {
              isTweetLoading.value = false;
              return;
            }

            isTweetLoading.value = true;
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
                container.innerHTML = `<a href="${url}" target="_blank" class="text-blue-500 underline font-bold mt-4 block">お品書きを見る (外部サイトへ移動)</a>`;
              }
            } else {
              isTweetLoading.value = false;
            }
          } else {
            isTweetLoading.value = false;
          }
        });
        
        const mapScale = ref(1.0);
        const pinX = ref(617);
        const pinY = ref(84);
        let isDraggingPin = false;

        const shareUrl = computed(() => {
          if (!listId.value) return '';
          const url = new URL(window.location.href);
          url.searchParams.set('list', listId.value);
          return url.toString();
        });

        const syncFreeMemoFromState = () => {
          if (savedList.value['__FREE_MEMO__']) freeMemoText.value = savedList.value['__FREE_MEMO__'].text || '';
          if (savedList.value['__PIN_POS__']) {
            const sx = savedList.value['__PIN_POS__'].x;
            const sy = savedList.value['__PIN_POS__'].y;
            if (sx && sy && !(sx === 100 && sy === 100)) {
              pinX.value = sx;
              pinY.value = sy;
            }
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
          // キーボードショートカット ('/' で検索フォーカス、'Escape' でモーダルを閉じる)
          window.addEventListener('keydown', (e) => {
            const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
            const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable);
            if (e.key === '/' && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
              e.preventDefault();
              activeTab.value = 'search';
              nextTick(() => {
                searchInputRef.value?.focus();
              });
            } else if (e.key === 'Escape') {
              if (selectedCircle.value) selectedCircle.value = null;
              else if (showHelpModal.value) showHelpModal.value = false;
              else if (showBudgetModal.value) showBudgetModal.value = false;
              else if (showAuthModal.value) showAuthModal.value = false;
              else if (showShareModal.value) showShareModal.value = false;
            }
          });

          // PC画面へリサイズされた際に activeTab が 'map' のままだと右ペインが空になるのを防ぐ
          window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && activeTab.value === 'map') {
              activeTab.value = 'search';
            }
          });

          // ★ オフライン対策: キャッシュから即時データを復元 (SWR)
          try {
            const cachedData = localStorage.getItem('vggc12th_data_cache');
            if (cachedData) {
              const parsed = JSON.parse(cachedData);
              if (parsed.circles && parsed.circles.length) circles.value = parsed.circles;
              if (parsed.blocks && parsed.blocks.length) blocks.value = parsed.blocks;
            }
            const cachedExtra = localStorage.getItem('vggc12th_circle_info_cache');
            if (cachedExtra) {
              circleExtraInfo.value = JSON.parse(cachedExtra);
            }
          } catch (e) {
            console.warn('Cache restore skipped:', e);
          }
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
              supabaseClient.from('circle_info').select('*')
            ]);
            
            // 静的データのマッピング
            if (localRes && localRes.ok) {
              const data = await localRes.json();
              circles.value = data.circles;
              blocks.value = data.sort_order;
              try {
                localStorage.setItem('vggc12th_data_cache', JSON.stringify({
                  circles: data.circles,
                  blocks: data.sort_order
                }));
              } catch (e) {}
            }
            
            // Supabaseからの追加情報のマッピング
            if (supabaseRes && !supabaseRes.error && supabaseRes.data) {
              const infoMap = {};
              supabaseRes.data.forEach(info => {
                const rawTags = Array.isArray(info.tags) ? info.tags : [];
                const isAbsent = Boolean(info.is_absent) || rawTags.includes('__ABSENT__') || rawTags.includes('不参加') || rawTags.includes('欠席');
                const cleanTags = rawTags.filter(t => !String(t).startsWith('__'));
                infoMap[info.circle_id] = {
                  tags: cleanTags,
                  members: info.members || [],
                  oshinagaki_url: info.oshinagaki_url || '',
                  items: Array.isArray(info.items) ? info.items : [],
                  twitter_id: info.twitter_id || '',
                  staff_twitter: info.staff_twitter || '',
                  is_absent: isAbsent
                };
              });
              circleExtraInfo.value = infoMap;
              try {
                localStorage.setItem('vggc12th_circle_info_cache', JSON.stringify(infoMap));
              } catch (e) {}
            }

            // Supabase Realtime
            supabaseClient
              .channel('public:circle_info')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'circle_info' }, (payload) => {
                if (payload.new && payload.new.circle_id) {
                  const rawTags = Array.isArray(payload.new.tags) ? payload.new.tags : [];
                  const isAbsent = Boolean(payload.new.is_absent) || rawTags.includes('__ABSENT__') || rawTags.includes('不参加') || rawTags.includes('欠席');
                  const cleanTags = rawTags.filter(t => !String(t).startsWith('__'));
                  circleExtraInfo.value[payload.new.circle_id] = {
                    tags: cleanTags,
                    members: payload.new.members || [],
                    oshinagaki_url: payload.new.oshinagaki_url || '',
                    items: Array.isArray(payload.new.items) ? payload.new.items : [],
                    twitter_id: payload.new.twitter_id || '',
                    staff_twitter: payload.new.staff_twitter || '',
                    is_absent: isAbsent
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

        const isCircleAbsent = (circleId) => {
          const extra = circleExtraInfo.value[circleId];
          if (!extra) return false;
          return Boolean(extra.is_absent) || (extra.tags || []).includes('__ABSENT__') || (extra.tags || []).includes('不参加') || (extra.tags || []).includes('欠席');
        };

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
            savedList.value[circleId] = { memo: '', bought: false, soldout: false, price: '', priority: '', forWho: '', selectedItems: [] };
          }
        };

        const toggleBought = (circleId) => {
          if (isReadOnly.value || !savedList.value[circleId]) return;
          savedList.value[circleId].bought = !savedList.value[circleId].bought;
          if (savedList.value[circleId].bought) {
            savedList.value[circleId].soldout = false;
          }
        };

        const toggleSoldout = (circleId) => {
          if (isReadOnly.value || !savedList.value[circleId]) return;
          savedList.value[circleId].soldout = !savedList.value[circleId].soldout;
          if (savedList.value[circleId].soldout) {
            savedList.value[circleId].bought = false;
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
          if (soldoutSavings.value > 0) text += `完売浮き: ¥${soldoutSavings.value.toLocaleString()}\n`;
          text += `(全${savedCount.value}サークル中、${boughtCount.value}サークル購入済${soldoutCount.value > 0 ? ` / 完売: ${soldoutCount.value}` : ''})\n\n`;
          text += "#VGGC12th\n";
          if (listId.value && isPublic.value) {
            text += `\n${shareUrl.value}`;
          }
          const encoded = encodeURIComponent(text);
          window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
        };

        const exportToText = () => {
          let text = "📝 買い物リスト (VGGC 12th)\n";
          text += `合計予定額: ¥${totalPrice.value.toLocaleString()}`;
          if (soldoutSavings.value > 0) {
            text += ` (完売浮き: ¥${soldoutSavings.value.toLocaleString()})`;
          }
          text += "\n\n";
          sortedSavedCircles.value.forEach(c => {
            const data = savedList.value[c.circle_id];
            let status = '[未]';
            if (isCircleAbsent(c.circle_id)) status = '[不参加]';
            else if (data.soldout) status = '[完売]';
            else if (data.bought) status = '[済]';
            const prio = data.priority ? `(${data.priority})` : '';
            const price = data.price ? ` ¥${data.price}` : '';
            const who = data.forWho ? ` @${data.forWho}` : '';
            text += `${status} ${c.space_sym}-${c.space_num} ${c.circle_name} ${prio}${price}${who}\n`;
            if (data.memo) text += `  メモ: ${data.memo}\n`;
          });
          navigator.clipboard.writeText(text).then(() => alert("クリップボードにコピーしました！X(Twitter)やメモ帳に貼り付けられます。"));
        };

        
        const showBudgetModal = ref(false);

        const budgetAmount = computed(() => {
          return savedList.value['__BUDGET__'] ? parseInt(savedList.value['__BUDGET__']) || 0 : 0;
        });

        const remainingBudget = computed(() => {
          return budgetAmount.value - spentPrice.value;
        });

        const openBudgetModal = () => {
          if (isReadOnly.value) return;
          showBudgetModal.value = true;
        };

        const saveBudget = (amount) => {
          if (isReadOnly.value) return;
          const parsed = parseInt(amount);
          savedList.value['__BUDGET__'] = isNaN(parsed) ? 0 : parsed;
          showBudgetModal.value = false;
        };

        // ★ 購入予定総額（完売・スキップしたサークルは自動除外され、浮いた予算を再計算）
        const totalPrice = computed(() => {
          let total = 0;
          Object.keys(savedList.value).forEach(key => {
             if (key.startsWith('__')) return;
             if (savedList.value[key].soldout) return; // 完売分は予定総額から除外
             const price = parseInt(savedList.value[key].price);
             if (!isNaN(price)) total += price;
          });
          return total;
        });

        // ★ 完売・スキップによって浮いた予算額
        const soldoutSavings = computed(() => {
          let total = 0;
          Object.keys(savedList.value).forEach(key => {
             if (key.startsWith('__')) return;
             if (savedList.value[key].soldout) {
               const price = parseInt(savedList.value[key].price);
               if (!isNaN(price)) total += price;
             }
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
        
        const soldoutCount = computed(() => {
          return Object.keys(savedList.value).filter(k => !k.startsWith('__') && savedList.value[k].soldout).length;
        });

        const boughtCount = computed(() => {
          return Object.keys(savedList.value).filter(k => !k.startsWith('__') && savedList.value[k].bought).length;
        });

        const activeTargetCount = computed(() => {
          return Math.max(0, savedCount.value - soldoutCount.value);
        });

        const progressPercent = computed(() => {
          if (activeTargetCount.value === 0) return 0;
          return Math.min(100, Math.round((boughtCount.value / activeTargetCount.value) * 100));
        });
        
        const sortedSavedCircles = computed(() => {
          let list = circles.value.filter(c => savedList.value[c.circle_id]);
          if (hideBought.value) {
            list = list.filter(c => !savedList.value[c.circle_id].bought && !savedList.value[c.circle_id].soldout);
          }
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

          // ★ 完売・スキップ（soldout）および購入済み（bought）を最下部に退避
          // 順序: 0 = 未完了(最優先で上に来る), 1 = 購入済み, 2 = 完売・スキップ
          list.sort((a, b) => {
            const aData = savedList.value[a.circle_id] || {};
            const bData = savedList.value[b.circle_id] || {};
            const aStatus = aData.soldout ? 2 : (aData.bought ? 1 : 0);
            const bStatus = bData.soldout ? 2 : (bData.bought ? 1 : 0);
            return aStatus - bStatus;
          });

          return list;
        });

        const availableTags = computed(() => {
          const tags = new Set();
          const members = new Set();
          Object.values(circleExtraInfo.value).forEach(info => {
            (info.tags || []).forEach(t => {
              if (!String(t).startsWith('__')) tags.add(t);
            });
            (info.members || []).forEach(m => members.add(m));
          });
          return { tags: Array.from(tags).sort(), members: Array.from(members).sort() };
        });

                const relatedCircles = computed(() => {
          if (!selectedCircle.value) return [];
          const currentMembers = circleExtraInfo.value[selectedCircle.value.circle_id]?.members || [];
          if (currentMembers.length === 0) return [];
          return circles.value.filter(c => {
            if (c.circle_id === selectedCircle.value.circle_id) return false;
            const members = circleExtraInfo.value[c.circle_id]?.members || [];
            return currentMembers.some(m => members.includes(m));
          }).slice(0, 10);
        });

        const filteredCircles = computed(() => {
          const q = (searchQuery.value || '').trim().toLowerCase();
          return circles.value.filter(circle => {
            const extra = circleExtraInfo.value[circle.circle_id] || {};
            
            // ★ 商品名での部分一致
            const matchItemName = q && (extra.items || []).some(it => 
              it.name && it.name.toLowerCase().includes(q)
            );

            // ★ スペース配置（例: "M-31", "M31"）での部分一致
            const spaceFull = `${circle.space_sym || ''}-${circle.space_num || ''}`.toLowerCase();
            const spaceCompact = `${circle.space_sym || ''}${circle.space_num || ''}`.toLowerCase();
            const matchSpace = q && (spaceFull.includes(q) || spaceCompact.includes(q));

            const matchQuery = !q || 
              (circle.circle_name && circle.circle_name.toLowerCase().includes(q)) ||
              (circle.penname && circle.penname.toLowerCase().includes(q)) ||
              (circle.circle_kana && circle.circle_kana.includes(q)) ||
              matchSpace ||
              matchItemName;

            const matchBlock = !filterBlock.value || circle.space_sym === filterBlock.value;
            const matchMember = !filterMember.value || (extra.members || []).includes(filterMember.value);
            const matchItemTag = !filterItemTag.value || (extra.tags || []).includes(filterItemTag.value);
              
            const matchOshinagaki = !filterHasOshinagaki.value || Boolean(extra.oshinagaki_url) || ((extra.items || []).length > 0);
              
            return matchQuery && matchBlock && matchMember && matchItemTag && matchOshinagaki;
          });
        });

        const onTogglePublic = async (newVal) => {
          isPublic.value = newVal;
          if (user.value) {
            await supabaseClient.from('shopping_lists').update({ is_public: newVal }).eq('user_id', user.value.id);
          }
        };
        const signOut = async () => { await supabaseClient.auth.signOut(); savedList.value = {}; listId.value = null; isPublic.value = false; freeMemoText.value = ''; };
        const exitReadOnly = () => { const url = new URL(window.location.href); url.searchParams.delete('list'); window.location.href = url.toString(); };

        
</script>

<style scoped>

    .custom-scrollbar::-webkit-scrollbar {
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;
    }


    body { font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; -webkit-tap-highlight-color: transparent; overscroll-behavior-y: none; }
    button, a, label, select, input, textarea { touch-action: manipulation; }
    
    .map-container { 
      position: relative; 
      width: 100%; 
      height: 100%;
      overflow: auto; 
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
      max-width: none !important; 
      display: block; 
      user-select: none;
      -webkit-user-drag: none;
      pointer-events: none; 
      transform: translateZ(0);
    }

    .list-map-dot {
      position: absolute;
      border-radius: 9999px;
      border: 1px solid #ffffff;
      box-sizing: border-box;
      transform: translate3d(-50%, -50%, 0);
      will-change: left, top, width, height;
      backface-visibility: hidden;
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
      z-index: 15; 
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      will-change: left, top;
      backface-visibility: hidden;
    }
    .draggable-pin:active { cursor: grabbing; }
  
</style>