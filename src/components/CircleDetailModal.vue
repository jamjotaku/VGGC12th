<template>
  <transition name="modal">
    <div v-if="circle" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-6" @click.self="$emit('close')">
      <div class="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-2xl md:max-w-4xl lg:max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        <!-- ヘッダー -->
        <div class="p-3.5 md:p-5 border-b bg-white flex justify-between items-start relative z-10 shadow-sm">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded border border-blue-200 shadow-sm">
                {{ circle.space_sym }}-{{ circle.space_num }}
              </span>
              <span v-if="extra?.items?.length" class="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                お品書き登録済 ({{ extra.items.length }}品)
              </span>
            </div>
            <h2 class="font-bold text-lg md:text-2xl text-gray-900 leading-tight">{{ circle.circle_name }}</h2>
            <p class="text-xs md:text-sm text-gray-500 mt-0.5">代表: {{ circle.penname }}</p>
          </div>
          <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition flex-shrink-0">
            <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- スマホ用タブ切り替え（商品登録がある場合のみ表示） -->
        <div v-if="extra?.items?.length" class="flex border-b text-xs font-bold bg-gray-50 md:hidden">
          <button @click="mobileModalTab = 'items'" 
                  class="flex-1 py-2.5 text-center transition border-b-2 flex items-center justify-center gap-1.5"
                  :class="mobileModalTab === 'items' ? 'border-amber-500 text-amber-800 bg-white font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'">
            <span>📋 頒布物メニュー</span>
            <span class="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full text-[10px]">{{ extra.items.length }}</span>
          </button>
          <button @click="mobileModalTab = 'tweet'" 
                  class="flex-1 py-2.5 text-center transition border-b-2 flex items-center justify-center gap-1.5"
                  :class="mobileModalTab === 'tweet' ? 'border-amber-500 text-amber-800 bg-white font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'">
            <span>📸 お品書き画像 (X)</span>
          </button>
        </div>
        
        <!-- コンテンツ（スクロール領域：PCは2カラムグリッド） -->
        <div class="p-3.5 md:p-6 overflow-y-auto flex-1 bg-gray-50/70 space-y-5">
          
          <div class="flex flex-col md:grid md:grid-cols-12 md:gap-6">
            
            <!-- 左カラム: お品書きポスト埋め込み -->
            <div class="md:col-span-6 lg:col-span-7 space-y-3"
                 :class="{'hidden md:block': extra?.items?.length && mobileModalTab !== 'tweet'}">
              
              <div class="flex justify-between items-center px-1">
                <span class="text-xs font-bold text-gray-500 flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  公式X お品書きポスト
                </span>
                <a v-if="extra?.oshinagaki_url" 
                   :href="extra.oshinagaki_url" target="_blank" 
                   class="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5">
                  <span>Xで直接開く</span>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
              </div>

              <!-- お品書き埋め込みコンテナ -->
              <div class="bg-white border border-gray-200 rounded-2xl p-3 md:p-4 min-h-[320px] flex items-center justify-center text-gray-400 flex-col shadow-inner w-full relative">
                <!-- オフライン案内（圏外時） -->
                <div v-if="!isOnline" class="p-6 text-center space-y-3">
                  <div class="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto text-xl shadow-sm">
                    📡
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-800 text-sm mb-1">現在オフライン（圏外）です</h4>
                    <p class="text-xs text-gray-500 leading-relaxed">
                      公式Xのポスト画像は電波回復後に表示されます。<br>
                      <strong class="text-amber-800" v-if="extra?.items?.length">登録済みの頒布物メニューはオフラインでもご利用いただけます！</strong>
                    </p>
                  </div>
                  <button v-if="extra?.items?.length && mobileModalTab !== 'items'" 
                          @click="mobileModalTab = 'items'" 
                          class="md:hidden text-xs bg-amber-500 text-white font-bold px-3 py-2 rounded-xl shadow hover:bg-amber-600 transition">
                    📋 頒布物メニューを開く
                  </button>
                </div>

                <template v-else>
                  <!-- スケルトンUI -->
                  <div v-if="isTweetLoading" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm rounded-2xl z-10 transition-opacity duration-300">
                    <div class="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p class="text-xs text-gray-500 font-bold animate-pulse">お品書きを読み込み中...</p>
                  </div>

                  <!-- Xの埋め込みポストが表示されるコンテナ -->
                  <div v-show="extra?.oshinagaki_url" id="tweet-container" class="w-full flex justify-center"></div>
                  
                  <!-- URL未登録時 -->
                  <div v-show="!extra?.oshinagaki_url" class="text-center text-gray-400 py-10">
                    <svg class="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <p class="text-xs font-bold text-gray-500 mb-0.5">お品書き未登録</p>
                    <p class="text-[10px]">※公式Xのポストが登録されると表示されます</p>
                  </div>
                </template>
              </div>

            </div>

            <!-- 右カラム: メンバー・リンク ＆ 頒布物メニュー -->
            <div class="md:col-span-6 lg:col-span-5 space-y-4"
                 :class="{'hidden md:block': extra?.items?.length && mobileModalTab !== 'items'}">
              
              <!-- 外部リンク＆メンバータグ -->
              <div class="space-y-2">
                <div class="flex flex-wrap gap-1.5">
                  <!-- サークル主 X (合同サークル等で複数人の場合も全員表示) -->
                  <a v-for="authorId in authorTwitterList" :key="'au_'+authorId" :href="`https://x.com/${authorId}`" target="_blank" 
                     class="flex items-center gap-1 text-xs bg-gray-800 text-white px-2.5 py-1 rounded-lg hover:bg-gray-700 transition font-bold shadow-sm"
                     title="サークル主のXアカウント">
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    <span>@{{ authorId }}</span>
                  </a>

                  <!-- 売り子 X (登録がある場合) -->
                  <a v-for="staffId in staffTwitterList" :key="'st_'+staffId" :href="`https://x.com/${staffId}`" target="_blank" 
                     class="flex items-center gap-1 text-xs bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg hover:bg-purple-100 transition font-bold shadow-sm"
                     title="売り子さんのXアカウント">
                    <span>🤝</span>
                    <span>@{{ staffId }}</span>
                  </a>

                  <a v-if="circle.pixiv_url" :href="circle.pixiv_url" target="_blank" class="flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition font-bold shadow-sm">
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6H7v-2h2V7h2v2h2v2h-2v6z"/></svg>
                    Pixiv
                  </a>
                  <a v-if="circle.site_url" :href="circle.site_url" target="_blank" class="flex items-center gap-1 text-xs bg-indigo-500 text-white px-2.5 py-1 rounded-lg hover:bg-indigo-600 transition font-bold shadow-sm">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                    Web
                  </a>

                  <!-- ★ 公式速報 (サークル主 & 売り子の完売・在庫告知) -->
                  <a :href="getCircleOfficialSearchUrl(circle, extra)" target="_blank" 
                     class="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition font-bold border border-blue-200 shadow-sm"
                     title="サークル主・売り子の最新ツイートから完売・在庫・列情報を検索">
                    <span class="text-amber-500 font-bold">⚡</span>
                    <span>公式速報</span>
                    <svg class="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  </a>

                  <!-- ★ 口コミ・目撃情報 (参加者ツイート) -->
                  <a :href="getCirclePublicSearchUrl(circle)" target="_blank" 
                     class="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition font-bold border border-gray-200 shadow-sm"
                     title="参加者の目撃ツイートから完売や最後尾情報を検索">
                    <span>👥</span>
                    <span>目撃/列</span>
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  </a>
                </div>

                <!-- メンバーバッジ -->
                <div class="flex flex-wrap gap-1">
                  <span v-for="member in (extra?.members || [])" :key="'m_'+member" class="text-xs px-2.5 py-1 rounded-full border shadow-sm font-bold flex items-center gap-1" :style="getMemberStyle(member)">
                    <span>{{ getMemberMark(member) }}</span>
                    {{ member }}
                  </span>
                  <span v-for="tag in (extra?.tags || [])" :key="tag" class="text-xs px-2.5 py-1 bg-white text-gray-700 rounded-full border border-gray-200 shadow-sm font-bold">{{ tag }}</span>
                </div>
              </div>

              <!-- ★ お品書き商品メニュー (登録がある場合) -->
              <div v-if="extra?.items?.length" class="bg-white border border-amber-200 rounded-2xl p-3.5 md:p-4 shadow-sm">
                <div class="flex justify-between items-center mb-3">
                  <div class="text-xs md:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <span class="text-base">📋</span>
                    <span>頒布物・商品メニュー</span>
                    <span class="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                      {{ extra.items.length }}品
                    </span>
                  </div>
                  <span class="text-[10px] text-gray-400">タップして注文</span>
                </div>

                <div class="space-y-2">
                  <div v-for="item in extra.items" :key="item.name"
                       @click="$emit('toggleItem', circle.circle_id, item)"
                       class="p-2.5 md:p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none group"
                       :class="isItemSelected(item) 
                         ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-300/70 shadow-sm' 
                         : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100 hover:border-gray-300'">
                    
                    <div class="flex items-center gap-2.5 min-w-0 pr-2">
                      <!-- チェックボックス -->
                      <div class="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition"
                           :class="isItemSelected(item) ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300 bg-white group-hover:border-amber-400'">
                        <svg v-if="isItemSelected(item)" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                      </div>

                      <!-- 種類バッジ (新刊・既刊・特典など) -->
                      <span v-if="getItemBadge(item.name)" 
                            class="text-[10px] px-1.5 py-0.5 rounded font-bold border shrink-0" 
                            :class="getItemBadge(item.name).bg">
                        {{ getItemBadge(item.name).label }}
                      </span>

                      <!-- 商品名 -->
                      <span class="text-xs md:text-sm font-bold leading-snug truncate"
                            :class="isItemSelected(item) ? 'text-amber-950' : 'text-gray-800'">
                        {{ item.name }}
                      </span>
                    </div>

                    <!-- 価格 -->
                    <div class="text-right shrink-0">
                      <span class="font-bold text-xs md:text-sm font-mono"
                            :class="item.price > 0 ? (isItemSelected(item) ? 'text-amber-700' : 'text-gray-900') : 'text-green-600'">
                        {{ item.price > 0 ? '¥' + item.price.toLocaleString() : '無料' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 選択中の合計金額プレビュー -->
                <div v-if="selectedItemCount > 0" 
                     class="mt-3 pt-2.5 border-t border-dashed border-amber-200 flex justify-between items-center text-xs font-bold text-amber-900">
                  <span>選択中のお買い物 ({{ selectedItemCount }}点):</span>
                  <span class="text-sm md:text-base text-amber-600 font-mono font-bold">
                    ¥{{ selectedItemsTotal.toLocaleString() }}
                  </span>
                </div>
              </div>

            </div>

          </div>

          <!-- ★ 関連サークル (下部に配置) -->
          <div v-if="relatedCircles?.length > 0" class="mt-6 border-t border-gray-200 pt-5">
            <h3 class="text-xs md:text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              同じメンバーを扱っているサークル
            </h3>
            <div class="flex overflow-x-auto gap-2.5 pb-2 custom-scrollbar px-1">
              <div v-for="rc in relatedCircles" :key="'rc_'+rc.circle_id" @click="$emit('openCircle', rc)" class="flex-shrink-0 w-40 md:w-44 bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm cursor-pointer hover:border-pink-300 hover:shadow-md transition group">
                <div class="flex justify-between items-start mb-1">
                  <span class="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-bold rounded border border-gray-200">
                    {{ rc.space_sym }}-{{ rc.space_num }}
                  </span>
                  <span v-if="savedList[rc.circle_id]" class="text-[9px] font-bold text-pink-500 bg-pink-50 px-1 rounded">登録済</span>
                </div>
                <div class="font-bold text-xs text-gray-800 truncate group-hover:text-pink-600 transition">{{ rc.circle_name }}</div>
                <div class="flex flex-wrap gap-1 mt-1.5">
                  <span v-for="m in (circleExtraInfo[rc.circle_id]?.members || []).slice(0,2)" :key="'rcm_'+m" class="text-[9px] px-1 py-0.5 rounded font-bold" :style="getMemberStyle(m)">
                    {{ getMemberMark(m) }}{{ m }}
                  </span>
                  <span v-if="(circleExtraInfo[rc.circle_id]?.members || []).length > 2" class="text-[9px] text-gray-400 font-bold">+{{ (circleExtraInfo[rc.circle_id]?.members || []).length - 2 }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
        
        <!-- アクションエリア（最下部固定：リスト操作） -->
        <div class="p-3 md:p-4 border-t bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
          <!-- リストに追加されていない場合 -->
          <button v-if="!savedList[circle.circle_id] && !isReadOnly" @click="$emit('toggleSave', circle.circle_id)" 
                  class="w-full bg-pink-500 text-white font-bold py-3 md:py-3.5 rounded-xl hover:bg-pink-600 active:scale-95 transition shadow flex items-center justify-center gap-2 text-base md:text-lg">
            <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span>買い物リストに追加</span>
            <span v-if="selectedItemsTotal > 0" class="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs md:text-sm font-mono">
              ¥{{ selectedItemsTotal.toLocaleString() }}
            </span>
          </button>
          
          <!-- リストに追加されている場合 -->
          <div v-else-if="savedList[circle.circle_id]" class="space-y-2.5">
            <div class="flex justify-between items-center">
              <span class="text-xs md:text-sm font-bold text-pink-600 flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                <span>買い物リスト登録済み</span>
                <span v-if="savedList[circle.circle_id].price" class="text-xs bg-pink-50 px-2 py-0.5 rounded-full text-pink-700 font-mono ml-1">
                  ¥{{ Number(savedList[circle.circle_id].price).toLocaleString() }}
                </span>
                <span v-if="savedList[circle.circle_id].soldout" class="text-xs bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-bold ml-1">
                  💔 完売マーク中
                </span>
                <span v-else-if="savedList[circle.circle_id].bought" class="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold ml-1">
                  ✓ 購入済
                </span>
              </span>
              <button v-if="!isReadOnly" @click="$emit('toggleSave', circle.circle_id)" class="text-xs text-gray-400 hover:text-red-500 underline">リストから削除</button>
            </div>

            <!-- クイックステータスボタン (購入済み / 完売) -->
            <div v-if="!isReadOnly" class="grid grid-cols-12 gap-2">
              <button @click="$emit('toggleBought', circle.circle_id)"
                      class="col-span-8 py-2 px-3 rounded-lg font-bold text-xs md:text-sm transition flex items-center justify-center gap-1.5 border"
                      :class="savedList[circle.circle_id].bought 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-300/50' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50 hover:text-emerald-700'">
                <span>{{ savedList[circle.circle_id].bought ? '✓ 購入済（タップで戻す）' : '🛒 購入済みにする' }}</span>
              </button>
              <button @click="$emit('toggleSoldout', circle.circle_id)"
                      class="col-span-4 py-2 px-2 rounded-lg font-bold text-xs md:text-sm transition flex items-center justify-center gap-1 border"
                      :class="savedList[circle.circle_id].soldout 
                        ? 'bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-300/50' 
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-rose-50 hover:text-rose-700'">
                <span>💔</span>
                <span>{{ savedList[circle.circle_id].soldout ? '完売中' : '完売マーク' }}</span>
              </button>
            </div>
            
            <div class="flex flex-wrap items-center gap-2">
              <select v-model="savedList[circle.circle_id].priority" :disabled="isReadOnly" class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:ring-1 focus:ring-pink-400 outline-none" :class="priorityColors[savedList[circle.circle_id].priority]">
                <option value="">優先度: -</option>
                <option value="S">S (絶対買う)</option>
                <option value="A">A (買いたい)</option>
                <option value="B">B (見に行く)</option>
              </select>
              <div class="flex items-center text-xs border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                <span class="px-2 text-gray-500 font-bold">¥</span>
                <input type="number" v-model.number="savedList[circle.circle_id].price" :readonly="isReadOnly" placeholder="金額" class="w-20 py-1.5 px-1 bg-transparent outline-none focus:bg-white text-right font-mono font-bold">
              </div>
              <input type="text" v-model="savedList[circle.circle_id].forWho" :readonly="isReadOnly" placeholder="誰用？(例: 自分)" class="flex-1 min-w-[90px] text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 outline-none focus:bg-white focus:ring-1 focus:ring-pink-400">
            </div>
            <textarea v-model="savedList[circle.circle_id].memo" :readonly="isReadOnly" placeholder="メモを入力...（例: 新刊セット、アクスタ）" 
                      class="w-full px-3 py-1.5 text-xs md:text-sm rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none h-12 bg-gray-50 focus:bg-white"></textarea>
          </div>
          
          <div v-else class="text-center text-xs text-gray-500 py-1">
            ※閲覧専用モードのため編集できません
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getItemBadge } from '../utils/badges';
import { getMemberStyle, getMemberMark } from '../utils/memberStyle';
import { priorityColors } from '../constants';
import { getCircleOfficialSearchUrl, getCirclePublicSearchUrl, cleanTwitterHandle, parseTwitterHandles } from '../utils/xSearch';

const props = defineProps({
  circle: {
    type: Object,
    default: null
  },
  circleExtraInfo: {
    type: Object,
    default: () => ({})
  },
  savedList: {
    type: Object,
    default: () => ({})
  },
  isReadOnly: {
    type: Boolean,
    default: false
  },
  relatedCircles: {
    type: Array,
    default: () => []
  },
  isTweetLoading: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: true
  }
});

defineEmits(['close', 'toggleSave', 'toggleBought', 'toggleSoldout', 'toggleItem', 'openCircle']);

const mobileModalTab = ref('items');

const extra = computed(() => {
  if (!props.circle) return null;
  return props.circleExtraInfo[props.circle.circle_id] || null;
});

// サークル主X (合同サークルの複数人にも対応)
const authorTwitterList = computed(() => {
  const ids = [
    ...parseTwitterHandles(props.circle?.twitter_id),
    ...parseTwitterHandles(extra.value?.twitter_id)
  ];
  return Array.from(new Set(ids));
});

// 売り子X (複数人対応)
const staffTwitterList = computed(() => {
  return parseTwitterHandles(extra.value?.staff_twitter);
});

// モーダルが開かれたらタブを初期化
watch(() => props.circle, (newCircle) => {
  if (newCircle) {
    const hasItems = props.circleExtraInfo[newCircle.circle_id]?.items?.length > 0;
    if (!props.isOnline && hasItems) {
      mobileModalTab.value = 'items';
    } else {
      mobileModalTab.value = hasItems ? 'items' : 'tweet';
    }
  }
});

const isItemSelected = (item) => {
  if (!props.circle) return false;
  const saved = props.savedList[props.circle.circle_id];
  if (!saved || !saved.selectedItems) return false;
  return saved.selectedItems.includes(item.name);
};

const selectedItemCount = computed(() => {
  if (!props.circle) return 0;
  const saved = props.savedList[props.circle.circle_id];
  return (saved?.selectedItems || []).length;
});

const selectedItemsTotal = computed(() => {
  if (!props.circle) return 0;
  const saved = props.savedList[props.circle.circle_id];
  if (!saved || !saved.selectedItems) return 0;
  const items = extra.value?.items || [];
  return items
    .filter(it => saved.selectedItems.includes(it.name))
    .reduce((sum, it) => sum + (Number(it.price) || 0), 0);
});
</script>
