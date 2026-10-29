<template>
  <div class="bg-white rounded-2xl shadow-sm border border-emerald-200 p-3.5 md:p-5 flex flex-col space-y-3.5">
    
    <!-- ヘッダーエリア -->
    <div class="flex items-center justify-between border-b border-emerald-100 pb-3 flex-wrap gap-2">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs">
          ⏰
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="font-extrabold text-gray-900 text-sm md:text-base">当日タイムスケジュール</h2>
            <span class="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              {{ sortedEvents.length }}件
            </span>
          </div>
          <p class="text-[11px] text-gray-500">じゃんけん・サイン・コスプレ等の時間を時系列で管理</p>
        </div>
      </div>

      <!-- 右側ボタングループ -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <!-- テキスト共有コピー -->
        <button v-if="sortedEvents.length > 0"
                @click="copyTimelineText"
                class="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="LINEやX(Twitter)用に整形テキストをコピー">
          <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
          <span class="hidden sm:inline">共有コピー</span>
        </button>

        <!-- 公式スケジュール一括追加 -->
        <button v-if="!isReadOnly && !hasOfficialPresets"
                @click="addOfficialPresets"
                class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="一般入場や閉会など公式枠をワンタップ追加">
          <span>📢</span>
          <span class="hidden sm:inline">公式枠追加</span>
        </button>

        <!-- 予定追加ボタン -->
        <button v-if="!isReadOnly"
                @click="openAddModal()"
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-extrabold transition shadow-sm flex items-center gap-1 cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          <span>予定を追加</span>
        </button>
      </div>
    </div>

    <!-- 直近の予定 (NEXT) アラートバナー (未完了かつ次の予定がある場合) -->
    <div v-if="nextUpcomingEvent" 
         class="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-300 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs">
      <div class="flex items-center gap-2 min-w-0">
        <span class="flex h-2.5 w-2.5 relative shrink-0">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
        </span>
        <span class="text-xs font-bold text-emerald-900 shrink-0">
          NEXT: {{ nextUpcomingEvent.time }}〜
        </span>
        <span class="text-xs font-bold text-gray-800 truncate">
          {{ nextUpcomingEvent.title }}
        </span>
      </div>
      <span v-if="minutesUntilNext !== null" class="text-[11px] font-mono font-extrabold text-emerald-700 bg-white/90 border border-emerald-200 px-2 py-0.5 rounded-lg shrink-0 shadow-xs">
        {{ minutesUntilNext > 0 ? `あと ${minutesUntilNext}分` : 'まもなく開始！' }}
      </span>
    </div>

    <!-- タイムライン表示領域 -->
    <div class="relative min-h-[160px]">
      
      <!-- 予定が1件もない場合 -->
      <div v-if="sortedEvents.length === 0" class="text-center py-8 px-4 text-gray-400 space-y-3">
        <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-xs">
          📅
        </div>
        <div class="space-y-1">
          <p class="font-bold text-gray-700 text-sm">タイムスケジュールはまだ登録されていません</p>
          <p class="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            サークルのポスターじゃんけんやサイン会、コスプレイヤーさんの登場時間などを時間順にメモして、当日の見落としを防ぎましょう！
          </p>
        </div>
        <div class="flex items-center justify-center gap-2 pt-1">
          <button v-if="!isReadOnly" @click="openAddModal()" 
                  class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer">
            ＋ 最初の予定を追加
          </button>
          <button v-if="!isReadOnly" @click="addOfficialPresets" 
                  class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl transition cursor-pointer">
            📢 公式枠をセット
          </button>
        </div>
      </div>

      <!-- タイムラインリスト (時系列順) -->
      <div v-else class="space-y-3 relative">
        
        <template v-for="(item, index) in timelineItemsWithNowMarker" :key="item.key">
          
          <!-- 🔴 現在時刻インジケーター (NOWライン) -->
          <div v-if="item.isNowMarker" 
               class="flex items-center gap-2 py-1 select-none animate-pulse">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0"></span>
            <div class="h-0.5 flex-1 bg-gradient-to-r from-rose-500 via-rose-400 to-transparent"></div>
            <span class="text-[11px] font-mono font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md shadow-xs">
              NOW {{ currentTimeStr }}
            </span>
          </div>

          <!-- 通常のタイムラインイベントカード -->
          <div v-else
               class="rounded-xl border transition-all duration-200 relative group overflow-hidden"
               :class="[
                 item.event.done ? 'bg-gray-50/80 border-gray-200 opacity-60' : 'bg-white border-gray-200/90 hover:border-emerald-300 hover:shadow-sm',
                 isEventOngoing(item.event) ? 'ring-2 ring-emerald-500/80 border-emerald-400 bg-emerald-50/20 shadow-xs' : ''
               ]">
            
            <div class="p-3 flex items-start gap-2.5">
              
              <!-- 完了チェックボックス -->
              <button @click="toggleEventDone(item.event.id)"
                      :disabled="isReadOnly"
                      class="mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer"
                      :class="item.event.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white hover:border-emerald-400'"
                      title="完了 / 未完了を切り替え">
                <svg v-if="item.event.done" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </button>

              <!-- メインコンテンツ -->
              <div class="flex-1 min-w-0 space-y-1">
                
                <!-- 1行目: 時間 & カテゴリ & ステータスバッジ -->
                <div class="flex items-center flex-wrap gap-1.5">
                  <!-- 時刻 -->
                  <span class="font-mono font-extrabold text-xs md:text-sm text-gray-900 flex items-center gap-0.5">
                    <span>{{ item.event.time }}</span>
                    <span v-if="item.event.endTime" class="text-gray-400 font-normal">〜{{ item.event.endTime }}</span>
                  </span>

                  <!-- カテゴリバッジ -->
                  <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                        :class="getCategoryMeta(item.event.category).bg">
                    {{ getCategoryMeta(item.event.category).icon }} {{ getCategoryMeta(item.event.category).label }}
                  </span>

                  <!-- 開催中(NOW)バッジ -->
                  <span v-if="isEventOngoing(item.event)"
                        class="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                    🟢 開催中
                  </span>

                  <!-- 直近(NEXT)バッジ -->
                  <span v-else-if="item.event.id === nextUpcomingEvent?.id"
                        class="text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded-full">
                    まもなく
                  </span>
                </div>

                <!-- 2行目: タイトル -->
                <h4 class="font-bold text-xs md:text-sm leading-snug break-words"
                    :class="item.event.done ? 'text-gray-500 line-through' : 'text-gray-900'">
                  {{ item.event.title }}
                </h4>

                <!-- 3行目: 場所・サークル連携・Xリンク・メモ -->
                <div class="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                  
                  <!-- サークル連携ボタン (タップで詳細モーダルまたはマップへ) -->
                  <div v-if="item.event.circleId || item.event.space" class="inline-flex items-center gap-1">
                    <button v-if="getMatchedCircle(item.event)"
                            @click="$emit('openCircle', getMatchedCircle(item.event))"
                            class="inline-flex items-center gap-1 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer"
                            title="サークル詳細・お品書きを開く">
                      <span>📍 {{ getMatchedCircle(item.event).space_sym }}-{{ getMatchedCircle(item.event).space_num }}</span>
                      <span class="truncate max-w-[120px]">{{ getMatchedCircle(item.event).circle_name }}</span>
                    </button>
                    <button v-if="getMatchedCircle(item.event)"
                            @click="$emit('jumpToMap', getMatchedCircle(item.event))"
                            class="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                            title="マップで位置を確認">
                      🗺️
                    </button>
                    <!-- サークルが紐付かない場所指定 -->
                    <span v-else-if="item.event.location || item.event.space" class="text-gray-500 text-[11px] flex items-center gap-1">
                      <span>📍</span>
                      <span>{{ item.event.location || item.event.space }}</span>
                    </span>
                  </div>
                  <span v-else-if="item.event.location" class="text-gray-500 text-[11px] flex items-center gap-1">
                    <span>📍</span>
                    <span>{{ item.event.location }}</span>
                  </span>

                  <!-- X (Twitter) リンク -->
                  <a v-if="item.event.twitter"
                     :href="formatTwitterUrl(item.event.twitter)"
                     target="_blank"
                     rel="noopener noreferrer"
                     class="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg transition"
                     title="X (Twitter) で最新ポストを確認">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    <span>最新ポスト</span>
                  </a>

                  <!-- 詳細メモ -->
                  <span v-if="item.event.memo" class="text-gray-500 text-[11px] flex items-center gap-1 break-words">
                    <span>📝</span>
                    <span>{{ item.event.memo }}</span>
                  </span>
                </div>

              </div>

              <!-- 右端: 編集・削除ボタン -->
              <div v-if="!isReadOnly" class="flex items-center gap-1 shrink-0">
                <button @click="openEditModal(item.event)"
                        class="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title="編集">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
                <button @click="removeEvent(item.event.id)"
                        class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="削除">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>

            </div>
          </div>

        </template>
      </div>

    </div>

    <!-- コピー完了トースト通知 -->
    <transition name="toast">
      <div v-if="showToast" 
           class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2">
        <span>✓</span>
        <span>タイムスケジュールをクリップボードにコピーしました！</span>
      </div>
    </transition>

    <!-- =========================================
         予定 追加・編集 モーダル
         ========================================= -->
    <teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal"
             class="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6"
             @click.self="closeModal">
          <div class="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            <!-- モーダルヘッダー -->
            <div class="p-4 border-b flex items-center justify-between bg-gray-50/70">
              <div class="flex items-center gap-2">
                <span class="text-lg">⏰</span>
                <h3 class="font-extrabold text-gray-900 text-sm md:text-base">
                  {{ isEditing ? '予定を編集' : '新しい予定を追加' }}
                </h3>
              </div>
              <button @click="closeModal" class="p-1.5 text-gray-400 hover:text-gray-600 rounded-full transition cursor-pointer">
                ✕
              </button>
            </div>

            <!-- モーダルフォーム本文 -->
            <div class="p-4 md:p-5 overflow-y-auto space-y-4 text-xs md:text-sm">
              
              <!-- クイック定型タグ (新規追加時のみ) -->
              <div v-if="!isEditing" class="space-y-1.5">
                <label class="font-bold text-gray-600 text-[11px] block">クイック定型タグ（タップで自動入力）</label>
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="tag in QUICK_TAGS" :key="tag.label"
                          type="button"
                          @click="applyQuickTag(tag)"
                          class="px-2.5 py-1 rounded-lg border text-xs font-bold transition active:scale-95 cursor-pointer hover:bg-emerald-50 hover:border-emerald-300"
                          :class="form.title === tag.title ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300' : 'bg-gray-50 text-gray-700 border-gray-200'">
                    {{ tag.label }}
                  </button>
                </div>
              </div>

              <!-- 時間設定 (開始時刻 〜 終了時刻) -->
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="font-bold text-gray-700 text-xs block">開始時刻 <span class="text-rose-500">*</span></label>
                  <input type="time" v-model="form.time" required
                         class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm focus:bg-white focus:ring-2 focus:ring-emerald-400 outline-none">
                </div>
                <div class="space-y-1">
                  <label class="font-bold text-gray-700 text-xs block">終了時刻 <span class="text-gray-400 font-normal">(任意)</span></label>
                  <input type="time" v-model="form.endTime"
                         class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm focus:bg-white focus:ring-2 focus:ring-emerald-400 outline-none">
                </div>
              </div>

              <!-- カテゴリ選択 -->
              <div class="space-y-1">
                <label class="font-bold text-gray-700 text-xs block">カテゴリ</label>
                <div class="grid grid-cols-3 gap-1.5">
                  <button v-for="(cat, key) in CATEGORIES" :key="key"
                          type="button"
                          @click="form.category = key"
                          class="py-1.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                          :class="form.category === key ? `${cat.bg} ring-2 ring-emerald-400 font-extrabold shadow-2xs` : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'">
                    <span>{{ cat.icon }}</span>
                    <span>{{ cat.label }}</span>
                  </button>
                </div>
              </div>

              <!-- タイトル入力 -->
              <div class="space-y-1">
                <label class="font-bold text-gray-700 text-xs block">予定タイトル <span class="text-rose-500">*</span></label>
                <input type="text" v-model="form.title" placeholder="例: 【A-12b】ポスターじゃんけん、〇〇さんサイン" required
                       class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-400 outline-none">
              </div>

              <!-- サークル選択 / 連携 (インクリメンタルサジェスト) -->
              <div class="space-y-1 relative">
                <label class="font-bold text-gray-700 text-xs flex justify-between items-center">
                  <span>サークルと紐付け <span class="text-gray-400 font-normal">(任意・タップで詳細やマップへ)</span></span>
                  <button v-if="form.circleId" type="button" @click="clearCircleLink" class="text-[10px] text-rose-500 hover:underline">紐付け解除</button>
                </label>
                <input type="text" v-model="circleSearchQuery" @focus="showCircleSuggest = true"
                       placeholder="サークル名またはスペース番号で検索 (例: A-12, ぶいすぽ)"
                       class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-400 outline-none">
                
                <!-- サジェストドロップダウン -->
                <div v-if="showCircleSuggest && filteredCircleSuggestions.length > 0"
                     class="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-gray-100">
                  <div v-for="c in filteredCircleSuggestions" :key="c.circle_id"
                       @click="selectCircle(c)"
                       class="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition text-xs">
                    <div class="min-w-0 pr-2">
                      <span class="inline-block px-1.5 py-0.2 bg-gray-100 text-gray-700 font-mono font-bold rounded mr-1.5 border">
                        {{ c.space_sym }}-{{ c.space_num }}
                      </span>
                      <span class="font-bold text-gray-800">{{ c.circle_name }}</span>
                    </div>
                    <span v-if="savedList[c.circle_id]" class="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded font-bold shrink-0">
                      リスト登録中
                    </span>
                  </div>
                </div>
              </div>

              <!-- 場所 (自由入力) -->
              <div class="space-y-1">
                <label class="font-bold text-gray-700 text-xs block">場所 / エリア <span class="text-gray-400 font-normal">(任意)</span></label>
                <input type="text" v-model="form.location" placeholder="例: コスプレ庭園エリア、TRC正面入口、2F休憩所"
                       class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-400 outline-none">
              </div>

              <!-- X (Twitter) アカウント / 告知URL -->
              <div class="space-y-1">
                <label class="font-bold text-gray-700 text-xs block">X (Twitter) リンク / ID <span class="text-gray-400 font-normal">(任意・最新状況確認用)</span></label>
                <input type="text" v-model="form.twitter" placeholder="例: @handle または ポストURL"
                       class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-400 outline-none">
              </div>

              <!-- 条件・持ち物・注意点メモ -->
              <div class="space-y-1">
                <label class="font-bold text-gray-700 text-xs block">条件・持ち物メモ <span class="text-gray-400 font-normal">(任意)</span></label>
                <input type="text" v-model="form.memo" placeholder="例: 12:50列形成、指定色紙持参、100円玉準備"
                       class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-400 outline-none">
              </div>

            </div>

            <!-- モーダルフッター -->
            <div class="p-3.5 border-t bg-gray-50 flex items-center justify-end gap-2">
              <button type="button" @click="closeModal" 
                      class="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl font-bold transition cursor-pointer text-xs">
                キャンセル
              </button>
              <button type="button" @click="submitForm"
                      :disabled="!form.time || !form.title"
                      class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-extrabold transition shadow-sm cursor-pointer text-xs">
                {{ isEditing ? '変更を保存' : '予定を追加' }}
              </button>
            </div>

          </div>
        </div>
      </transition>
    </teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  timelineEvents: {
    type: Array,
    default: () => []
  },
  circles: {
    type: Array,
    default: () => []
  },
  savedList: {
    type: Object,
    default: () => ({})
  },
  isReadOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:timelineEvents', 'openCircle', 'jumpToMap']);

// カテゴリ定義
const CATEGORIES = {
  circle: { label: 'サークル', icon: '🎪', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  sign: { label: 'サイン対応', icon: '✒️', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  cosplay: { label: 'コスプレ', icon: '📸', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  official: { label: '公式', icon: '📢', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  meet: { label: '待ち合わせ', icon: '🤝', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  other: { label: 'その他/休憩', icon: '🍙', bg: 'bg-gray-100 text-gray-700 border-gray-200' }
};

// クイック定型タグ
const QUICK_TAGS = [
  { label: '🎪 ポスターじゃんけん', category: 'circle', title: 'ポスターじゃんけん' },
  { label: '✒️ サイン対応・サイン会', category: 'sign', title: 'サイン対応' },
  { label: '📸 コスプレ撮影', category: 'cosplay', title: 'コスプレ撮影' },
  { label: '🎁 ノベルティ配布', category: 'circle', title: '限定ノベルティ配布開始' },
  { label: '🤝 友人合流・待ち合わせ', category: 'meet', title: '待ち合わせ・合流' },
  { label: '🍙 昼食・休憩', category: 'other', title: '昼食・休憩' }
];

// 公式スケジュールテンプレート
const OFFICIAL_PRESETS = [
  { time: '12:00', endTime: '15:30', category: 'official', title: '📢 一般入場開始・即売会スタート', location: '全ホール', memo: '買い物リスト順に巡回開始！' },
  { time: '15:30', endTime: '15:45', category: 'official', title: '🏁 即売会終了', location: '全ホール', memo: '一般頒布終了・閉会アナウンス' },
  { time: '15:45', endTime: '16:30', category: 'official', title: '🏆 本部前 大じゃんけん大会', location: '本部前', memo: '公式企画ポスターじゃんけん' },
  { time: '16:30', endTime: '', category: 'official', title: '👋 完全撤収・イベント終了', location: '会場出口', memo: 'お疲れ様でした！' }
];

// =========================================
// 現在時刻のリアルタイム連動
// =========================================
const now = ref(new Date());
let timer = null;

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 20000); // 20秒ごとに時刻更新
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

// 現在時刻 "HH:mm" (24時間制)
const currentTimeStr = computed(() => {
  const d = now.value;
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
});

// 時系列順（開始時刻昇順）にソートしたイベント一覧
const sortedEvents = computed(() => {
  return [...props.timelineEvents].sort((a, b) => {
    if (a.time !== b.time) return a.time.localeCompare(b.time);
    return (a.endTime || '').localeCompare(b.endTime || '');
  });
});

// 公式プリセットが既に登録されているか判定
const hasOfficialPresets = computed(() => {
  return props.timelineEvents.some(e => e.category === 'official');
});

// カテゴリメタ情報取得
const getCategoryMeta = (catKey) => {
  return CATEGORIES[catKey] || CATEGORIES.other;
};

// 開催中判定
const isEventOngoing = (evt) => {
  const cur = currentTimeStr.value;
  if (evt.endTime) {
    return cur >= evt.time && cur <= evt.endTime;
  }
  return cur === evt.time;
};

// 次に控えている予定 (NEXT)
const nextUpcomingEvent = computed(() => {
  const cur = currentTimeStr.value;
  return sortedEvents.value.find(e => !e.done && e.time >= cur);
});

// 次の予定までの分数差
const minutesUntilNext = computed(() => {
  if (!nextUpcomingEvent.value) return null;
  const [curH, curM] = currentTimeStr.value.split(':').map(Number);
  const [nextH, nextM] = nextUpcomingEvent.value.time.split(':').map(Number);
  const diff = (nextH * 60 + nextM) - (curH * 60 + curM);
  return Math.max(0, diff);
});

// NOWラインを挿入したタイムラインアイテムリスト
const timelineItemsWithNowMarker = computed(() => {
  const items = [];
  const cur = currentTimeStr.value;
  const list = sortedEvents.value;
  let nowMarkerInserted = false;

  for (let i = 0; i < list.length; i++) {
    const evt = list[i];
    // 現在時刻がこのイベントより前、かつまだマーカー未挿入なら直前に挿入
    if (!nowMarkerInserted && cur < evt.time) {
      items.push({ isNowMarker: true, key: 'now_marker' });
      nowMarkerInserted = true;
    }
    items.push({ isNowMarker: false, event: evt, key: 'evt_' + evt.id });
  }

  // リストの全イベントが現在時刻より過去の場合、一番下にNOWマーカーを表示
  if (!nowMarkerInserted && list.length > 0) {
    items.push({ isNowMarker: true, key: 'now_marker' });
  }

  return items;
});

// 紐づくサークルオブジェクトを検索
const getMatchedCircle = (evt) => {
  if (!evt.circleId && !evt.space) return null;
  if (evt.circleId) {
    const found = props.circles.find(c => c.circle_id === evt.circleId);
    if (found) return found;
  }
  if (evt.space) {
    const spaceClean = evt.space.replace(/\s+/g, '').toUpperCase();
    return props.circles.find(c => `${c.space_sym}-${c.space_num}`.toUpperCase() === spaceClean) || null;
  }
  return null;
};

// TwitterリンクURLフォーマット
const formatTwitterUrl = (val) => {
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  const clean = val.replace(/^@/, '').trim();
  return `https://x.com/${clean}`;
};

// =========================================
// 予定追加・編集 モーダル管理
// =========================================
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const circleSearchQuery = ref('');
const showCircleSuggest = ref(false);

const form = ref({
  time: '13:00',
  endTime: '',
  category: 'circle',
  title: '',
  circleId: '',
  circleName: '',
  space: '',
  location: '',
  twitter: '',
  memo: ''
});

const openAddModal = (presetData = {}) => {
  isEditing.value = false;
  editingId.value = null;
  form.value = {
    time: presetData.time || '13:00',
    endTime: presetData.endTime || '',
    category: presetData.category || 'circle',
    title: presetData.title || '',
    circleId: presetData.circleId || '',
    circleName: presetData.circleName || '',
    space: presetData.space || '',
    location: presetData.location || '',
    twitter: presetData.twitter || '',
    memo: presetData.memo || ''
  };
  circleSearchQuery.value = presetData.circleName ? `${presetData.space ? presetData.space + ' ' : ''}${presetData.circleName}` : '';
  showCircleSuggest.value = false;
  showModal.value = true;
};

const openEditModal = (evt) => {
  isEditing.value = true;
  editingId.value = evt.id;
  form.value = { ...evt };
  circleSearchQuery.value = evt.circleName ? `${evt.space ? evt.space + ' ' : ''}${evt.circleName}` : (evt.space || '');
  showCircleSuggest.value = false;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

// クイック定型タグ適用
const applyQuickTag = (tag) => {
  form.value.category = tag.category;
  form.value.title = tag.title;
};

// サークルインクリメンタルサジェスト検索
const filteredCircleSuggestions = computed(() => {
  const q = circleSearchQuery.value.trim().toLowerCase();
  if (!q) return props.circles.slice(0, 10);
  return props.circles
    .filter(c => {
      const name = (c.circle_name || '').toLowerCase();
      const penname = (c.penname || '').toLowerCase();
      const space = `${c.space_sym}-${c.space_num}`.toLowerCase();
      return name.includes(q) || penname.includes(q) || space.includes(q);
    })
    .slice(0, 10);
});

// サークル選択
const selectCircle = (circle) => {
  form.value.circleId = circle.circle_id;
  form.value.circleName = circle.circle_name;
  form.value.space = `${circle.space_sym}-${circle.space_num}`;
  if (!form.value.location) form.value.location = `${circle.space_sym}-${circle.space_num}`;
  circleSearchQuery.value = `${circle.space_sym}-${circle.space_num} ${circle.circle_name}`;
  showCircleSuggest.value = false;
};

// サークル連携解除
const clearCircleLink = () => {
  form.value.circleId = '';
  form.value.circleName = '';
  form.value.space = '';
  circleSearchQuery.value = '';
};

// フォーム保存
const submitForm = () => {
  if (!form.value.time || !form.value.title) return;

  const currentList = [...props.timelineEvents];

  if (isEditing.value && editingId.value) {
    const idx = currentList.findIndex(e => e.id === editingId.value);
    if (idx !== -1) {
      currentList[idx] = {
        ...currentList[idx],
        ...form.value
      };
    }
  } else {
    const newEvent = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      done: false,
      ...form.value
    };
    currentList.push(newEvent);
  }

  emit('update:timelineEvents', currentList);
  closeModal();
};

// 完了トグル
const toggleEventDone = (id) => {
  if (props.isReadOnly) return;
  const currentList = props.timelineEvents.map(e => {
    if (e.id === id) {
      return { ...e, done: !e.done };
    }
    return e;
  });
  emit('update:timelineEvents', currentList);
};

// 削除
const removeEvent = (id) => {
  if (props.isReadOnly) return;
  const currentList = props.timelineEvents.filter(e => e.id !== id);
  emit('update:timelineEvents', currentList);
};

// 公式スケジュール一括追加
const addOfficialPresets = () => {
  if (props.isReadOnly) return;
  const currentList = [...props.timelineEvents];
  OFFICIAL_PRESETS.forEach((preset, idx) => {
    currentList.push({
      id: 'evt_official_' + Date.now() + '_' + idx,
      done: false,
      ...preset
    });
  });
  emit('update:timelineEvents', currentList);
};

// =========================================
// LINE / X 共有用テキストコピー
// =========================================
const showToast = ref(false);

const copyTimelineText = async () => {
  if (sortedEvents.value.length === 0) return;

  const lines = ['【VGGC 12th 私の当日タイムスケジュール】'];
  sortedEvents.value.forEach(evt => {
    const timeRange = evt.endTime ? `${evt.time}〜${evt.endTime}` : evt.time;
    const cat = getCategoryMeta(evt.category);
    let line = `・${timeRange} ${cat.icon} ${evt.title}`;
    if (evt.space || evt.location) {
      line += ` (📍${evt.space || evt.location})`;
    }
    if (evt.memo) {
      line += ` [📝${evt.memo}]`;
    }
    lines.push(line);
  });
  lines.push('#VGGC12th #ぶいすぽ');

  const text = lines.join('\n');
  try {
    await navigator.clipboard.writeText(text);
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 2500);
  } catch (err) {
    // クリップボードAPI失敗時のフォールバック
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 2500);
  }
};

defineExpose({
  openAddModal
});
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 15px);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
