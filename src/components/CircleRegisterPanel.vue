<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 select-none">
    <!-- =========================================================
         上部ヘッダーバー (タブレット横画面で一目で状態が分かるPOSヘッダー)
    ========================================================== -->
    <div class="bg-slate-900 text-white px-3 md:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-slate-800 shadow-sm">
      <!-- 左: サークル情報 & 同期ステータス -->
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="bg-amber-500 text-slate-950 font-black text-xs md:text-sm px-2.5 py-1 rounded-lg shadow-xs shrink-0 flex items-center gap-1">
          <span>🏪</span>
          <span>{{ circleSpaceLabel }}</span>
        </span>
        <div class="min-w-0">
          <div class="font-extrabold text-sm md:text-base truncate leading-tight">{{ circleName }}</div>
          <div class="text-[11px] text-slate-400 flex items-center gap-2">
            <span>サークル参加レジ (v1)</span>
            <span v-if="!isOnline" class="text-amber-400 font-bold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              オフライン稼働中(端末保存済)
            </span>
            <span v-else-if="isSyncing" class="text-sky-400 font-bold">🔄 クラウド同期中...</span>
            <span v-else-if="hasPendingSync" class="text-amber-300 font-bold">⏳ 未同期データあり</span>
            <span v-else class="text-emerald-400 font-bold">✓ クラウド同期済 (Rev.{{ registerState.revision }})</span>
          </div>
        </div>
      </div>

      <!-- 中央〜右: リアルタイム売上サマリーバッジ & サブビュー切替ボタン -->
      <div class="flex items-center gap-2 md:gap-3 ml-auto">
        <!-- 当日売上クイック表示 -->
        <div class="hidden sm:flex items-center gap-3 bg-slate-800/90 border border-slate-700 px-3.5 py-1.5 rounded-xl">
          <div>
            <div class="text-[10px] text-slate-400 font-bold">本日売上 ({{ validTransactions.length }}組)</div>
            <div class="text-sm md:text-base font-black text-amber-400 font-mono">¥{{ totalSalesAmount.toLocaleString() }}</div>
          </div>
          <div class="h-6 w-px bg-slate-700"></div>
          <div>
            <div class="text-[10px] text-slate-400 font-bold">頒布総数</div>
            <div class="text-sm md:text-base font-black text-white font-mono">{{ totalSoldItemsCount }}<span class="text-xs font-normal text-slate-400 ml-0.5">点</span></div>
          </div>
        </div>

        <!-- 画面モード切替タブ (タブレットで押しやすい大型ピル) -->
        <div class="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            @click="subTab = 'pos'"
            class="px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-extrabold transition flex items-center gap-1.5 cursor-pointer"
            :class="subTab === 'pos' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'"
          >
            <span>🛒</span>
            <span>レジ会計</span>
          </button>
          <button
            @click="subTab = 'inventory'"
            class="px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-extrabold transition flex items-center gap-1.5 cursor-pointer relative"
            :class="subTab === 'inventory' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'"
          >
            <span>📦</span>
            <span>在庫・商品管理</span>
            <span v-if="lowStockItemsCount > 0" class="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-mono">
              {{ lowStockItemsCount }}
            </span>
          </button>
          <button
            @click="subTab = 'history'"
            class="px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-extrabold transition flex items-center gap-1.5 cursor-pointer"
            :class="subTab === 'history' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'"
          >
            <span>📊</span>
            <span>売上・履歴</span>
            <span class="px-1.5 py-0.2 bg-slate-700 text-slate-200 rounded-full text-[10px] font-mono">
              {{ validTransactions.length }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- =========================================================
         1. メインPOSレジ画面 (タブレット横画面 2ペイン構成)
    ========================================================== -->
    <div v-if="subTab === 'pos'" class="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
      
      <!-- 左ペイン: 商品タッチパネルグリッド (幅 約58%〜62%) -->
      <div class="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-200">
        <!-- サブツールバー: クイック操作 -->
        <div class="bg-white px-4 py-2 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>👆 商品パネルをタップで加算（全 {{ allProducts.length }} 種）</span>
            <span v-if="lowStockItemsCount > 0" class="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[11px] font-extrabold">
              ⚠️ 残りわずか/完売 {{ lowStockItemsCount }}件
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="openQuickAddItemModal"
              class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-extrabold transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>＋ 当日商品を追加</span>
            </button>
            <button
              v-if="lastValidTransaction"
              @click="confirmVoidTransaction(lastValidTransaction)"
              class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              title="直前の会計を取り消して在庫を戻します"
            >
              <span>↩ 直前の会計取消 (¥{{ lastValidTransaction.total.toLocaleString() }})</span>
            </button>
          </div>
        </div>

        <!-- 商品カードグリッド (スクロール領域) -->
        <div class="flex-1 overflow-y-auto p-3 md:p-4 pb-24 md:pb-6">
          <div v-if="allProducts.length === 0" class="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center space-y-3">
            <div class="text-4xl">📦</div>
            <div class="text-base font-extrabold text-slate-700">頒布物データがまだ登録されていません</div>
            <p class="text-xs text-slate-500">右上の「＋ 当日商品を追加」ボタンから、その場で頒布物を登録してレジを開始できます。</p>
            <button
              @click="openQuickAddItemModal"
              class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-extrabold shadow-sm transition cursor-pointer"
            >
              ＋ 最初の商品を追加する
            </button>
          </div>

          <div v-else class="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3.5">
            <div
              v-for="product in allProducts"
              :key="product.id"
              @click="handleProductCardTap(product)"
              class="relative rounded-2xl border-2 p-3.5 md:p-4 flex flex-col justify-between min-h-[148px] md:min-h-[164px] transition-all shadow-xs"
              :class="getProductCardClass(product)"
            >
              <!-- 上段: ステータスバッジ & 完売切替ボタン -->
              <div class="flex items-start justify-between gap-1.5 mb-1.5">
                <div class="flex flex-wrap items-center gap-1">
                  <span v-if="product.isCustom" class="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200">
                    当日追加
                  </span>
                  <!-- 在庫状態バッジ -->
                  <span
                    v-if="product.isSoldOut"
                    class="text-xs font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-md shadow-2xs"
                  >
                    💔 完売
                  </span>
                  <span
                    v-else-if="product.isLowStock"
                    class="text-xs font-extrabold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md shadow-2xs animate-pulse"
                  >
                    ⚠️ 残り {{ product.remainingStock }}
                  </span>
                  <span
                    v-else-if="product.initialStock !== null"
                    class="text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md"
                  >
                    残 {{ product.remainingStock }}
                  </span>
                  <span
                    v-else
                    class="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                  >
                    在庫設定なし
                  </span>
                </div>

                <!-- ワンタップ手動完売トグル (イベント伝播ストップ) -->
                <button
                  @click.stop="toggleManualSoldOut(product)"
                  class="text-[11px] font-bold px-2 py-1 rounded-lg border transition shrink-0 cursor-pointer"
                  :class="product.manualSoldOut
                    ? 'bg-slate-800 text-white border-slate-900 hover:bg-slate-700'
                    : 'bg-white/90 text-slate-600 border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'"
                  :title="product.manualSoldOut ? '販売中に戻す' : '手動で売り切れにする'"
                >
                  {{ product.manualSoldOut ? '完売解除' : '完売にする' }}
                </button>
              </div>

              <!-- 中段: 商品名 -->
              <div class="my-1">
                <div class="font-extrabold text-base md:text-lg leading-snug line-clamp-2" :class="product.isSoldOut ? 'text-slate-400 line-through' : 'text-slate-900'">
                  {{ product.name }}
                </div>
              </div>

              <!-- 下段: 価格 & 頒布数 & カート内数量バッジ -->
              <div class="mt-2 pt-2 border-t border-slate-200/80 flex items-end justify-between gap-2">
                <div>
                  <div class="text-xl md:text-2xl font-black font-mono leading-none" :class="product.isSoldOut ? 'text-slate-400' : 'text-blue-700'">
                    ¥{{ product.price.toLocaleString() }}
                  </div>
                  <div class="text-[11px] font-bold text-slate-500 mt-1">
                    頒布済: <span class="font-mono font-extrabold text-slate-700">{{ product.soldCount }}</span> 点
                  </div>
                </div>

                <!-- カートに入っている場合の数量操作・表示 -->
                <div v-if="getCartQty(product.id) > 0" class="flex items-center gap-1.5" @click.stop>
                  <button
                    @click="changeCartQty(product.id, -1)"
                    class="w-9 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-900 font-black text-lg flex items-center justify-center shadow-xs cursor-pointer"
                  >
                    －
                  </button>
                  <div class="min-w-[38px] h-9 px-2 rounded-xl bg-blue-600 text-white font-black font-mono text-base flex items-center justify-center shadow-sm">
                    ×{{ getCartQty(product.id) }}
                  </div>
                  <button
                    @click="handleProductCardTap(product)"
                    :disabled="!canAddMoreToCart(product)"
                    class="w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shadow-xs cursor-pointer"
                    :class="canAddMoreToCart(product) ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'"
                  >
                    ＋
                  </button>
                </div>
                <div v-else-if="!product.isSoldOut" class="text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-xl">
                  ＋ 追加
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右ペイン: お会計明細 ＆ お釣り電卓ドロワー (タブレット横で幅 約38%〜42% 固定) -->
      <div class="w-full md:w-[380px] lg:w-[430px] xl:w-[460px] bg-white flex flex-col h-auto md:h-full shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:shadow-none z-10">
        <!-- カートヘッダー -->
        <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div class="font-extrabold text-sm md:text-base text-slate-800 flex items-center gap-2">
            <span>🧾 お買い上げ明細</span>
            <span v-if="cartTotalCount > 0" class="bg-blue-600 text-white text-xs font-mono font-black px-2 py-0.5 rounded-full">
              {{ cartTotalCount }}点
            </span>
          </div>
          <button
            v-if="cartItems.length > 0"
            @click="clearCart"
            class="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
          >
            クリア
          </button>
        </div>

        <!-- 明細リスト (スクロール) -->
        <div class="flex-1 overflow-y-auto px-4 py-2.5 space-y-2 max-h-[28vh] md:max-h-none min-h-[90px]">
          <div v-if="cartItems.length === 0" class="h-full flex flex-col items-center justify-center text-slate-400 py-6">
            <div class="text-2xl mb-1">🛒</div>
            <div class="text-xs font-bold">左のパネルから商品をタップしてください</div>
          </div>

          <div
            v-for="item in cartItems"
            :key="'cart_' + item.product.id"
            class="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2"
          >
            <div class="min-w-0 flex-1">
              <div class="font-extrabold text-sm text-slate-800 truncate">{{ item.product.name }}</div>
              <div class="text-xs font-mono text-slate-500">
                @¥{{ item.product.price.toLocaleString() }}
                <span v-if="item.product.initialStock !== null" class="ml-1 text-[10px] text-slate-400">
                  (残{{ item.product.remainingStock }})
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click="changeCartQty(item.product.id, -1)"
                class="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-black text-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
              >
                －
              </button>
              <span class="w-7 text-center font-mono font-black text-base text-slate-900">{{ item.qty }}</span>
              <button
                @click="changeCartQty(item.product.id, 1)"
                :disabled="!canAddMoreToCart(item.product)"
                class="w-8 h-8 rounded-lg border font-black flex items-center justify-center cursor-pointer"
                :class="canAddMoreToCart(item.product) ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700 active:scale-95' : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'"
              >
                ＋
              </button>
            </div>

            <div class="w-20 text-right font-mono font-black text-sm text-slate-900 shrink-0">
              ¥{{ (item.product.price * item.qty).toLocaleString() }}
            </div>
          </div>
        </div>

        <!-- 会計計算・お釣り・確定エリア (下部固定) -->
        <div class="p-3.5 md:p-4 bg-slate-900 text-white space-y-3 shrink-0 pb-20 md:pb-4">
          <!-- 合計金額バー -->
          <div class="flex items-baseline justify-between border-b border-slate-700 pb-2.5">
            <div class="text-xs font-bold text-slate-300">
              お支払い合計 <span class="text-amber-400 font-mono font-black">({{ cartTotalCount }}点)</span>
            </div>
            <div class="text-3xl md:text-4xl font-black font-mono text-white tracking-tight">
              ¥{{ cartTotalAmount.toLocaleString() }}
            </div>
          </div>

          <!-- 預かり金額 ＆ お釣り表示ボックス -->
          <div class="grid grid-cols-2 gap-2.5">
            <div class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-slate-400">お預かり</span>
                <button
                  v-if="depositAmount > 0"
                  @click="depositAmount = 0"
                  class="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
                >
                  クリア
                </button>
              </div>
              <div class="flex items-center gap-1 mt-0.5">
                <span class="text-sm font-bold text-slate-400">¥</span>
                <input
                  type="number"
                  v-model.number="depositInputModel"
                  placeholder="ちょうど"
                  min="0"
                  step="100"
                  class="w-full bg-transparent text-lg md:text-xl font-black font-mono text-white focus:outline-none placeholder:text-slate-500 placeholder:text-sm"
                />
              </div>
            </div>

            <div
              class="rounded-xl px-3 py-2 border flex flex-col justify-between"
              :class="changeAmount < 0
                ? 'bg-rose-950/80 border-rose-700 text-rose-200'
                : (depositAmount > 0 && changeAmount > 0 ? 'bg-emerald-950/90 border-emerald-600 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300')"
            >
              <div class="text-[11px] font-bold opacity-80">
                {{ changeAmount < 0 ? '⚠️ 不足金額' : 'お釣り' }}
              </div>
              <div class="text-xl md:text-2xl font-black font-mono leading-none mt-0.5">
                <template v-if="cartTotalAmount === 0">¥0</template>
                <template v-else-if="depositAmount === 0">¥0 <span class="text-xs font-normal opacity-75">(ちょうど)</span></template>
                <template v-else-if="changeAmount < 0">¥{{ Math.abs(changeAmount).toLocaleString() }} 不足</template>
                <template v-else>¥{{ changeAmount.toLocaleString() }}</template>
              </div>
            </div>
          </div>

          <!-- 預かり金ワンタップ金種ボタン群 (即売会特化) -->
          <div class="space-y-1.5">
            <div class="grid grid-cols-3 gap-1.5">
              <button
                @click="setExactDeposit"
                :disabled="cartTotalAmount === 0"
                class="py-2 rounded-lg font-extrabold text-xs md:text-sm bg-slate-700 hover:bg-slate-600 active:scale-95 text-amber-300 border border-slate-600 transition cursor-pointer disabled:opacity-40"
              >
                ちょうど
              </button>
              <button
                v-for="bill in [1000, 2000, 3000, 5000, 10000]"
                :key="'bill_' + bill"
                @click="depositAmount = bill"
                :disabled="cartTotalAmount === 0"
                class="py-2 rounded-lg font-mono font-extrabold text-xs md:text-sm bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700 transition cursor-pointer disabled:opacity-40"
              >
                ¥{{ bill.toLocaleString() }}
              </button>
            </div>
            <!-- 加算ボタン (+100 / +500 / +1000) -->
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="add in [100, 500, 1000]"
                :key="'add_' + add"
                @click="addDeposit(add)"
                :disabled="cartTotalAmount === 0"
                class="py-1.5 rounded-lg font-mono font-bold text-xs bg-slate-800/70 hover:bg-slate-700 active:scale-95 text-sky-300 border border-slate-700/80 transition cursor-pointer disabled:opacity-40"
              >
                ＋¥{{ add.toLocaleString() }}
              </button>
            </div>
          </div>

          <!-- 特大「会計確定」ボタン -->
          <button
            @click="completeCheckout"
            :disabled="!canCompleteCheckout"
            class="w-full py-3.5 md:py-4 rounded-2xl font-black text-base md:text-lg shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            :class="canCompleteCheckout
              ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 ring-2 ring-emerald-300/50'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'"
          >
            <span>✅ 会計確定</span>
            <span v-if="cartTotalAmount > 0" class="font-mono">
              (¥{{ cartTotalAmount.toLocaleString() }})
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- =========================================================
         2. 在庫・商品管理タブ (初期在庫設定・当日修正・当日商品追加)
    ========================================================== -->
    <div v-else-if="subTab === 'inventory'" class="flex-1 overflow-y-auto p-3 md:p-6 pb-24 space-y-5">
      <div class="max-w-5xl mx-auto space-y-5">
        
        <!-- 当日個人追加フォーム -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base md:text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <span>➕ 当日商品の個人追加</span>
                <span class="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                  公開お品書き(circle_info)は書き換えません
                </span>
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">当日朝に間に合った色紙や追加グッズなどをレジ専用ボタンとして追加します。</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end pt-1">
            <div class="sm:col-span-5">
              <label class="block text-xs font-bold text-slate-600 mb-1">商品名</label>
              <input
                v-model="newCustomItem.name"
                type="text"
                placeholder="例: 当日色紙 / 新刊ラミカ"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div class="sm:col-span-3">
              <label class="block text-xs font-bold text-slate-600 mb-1">頒布価格 (円)</label>
              <input
                v-model.number="newCustomItem.price"
                type="number"
                min="0"
                step="100"
                placeholder="1000"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-600 mb-1">初期在庫数 (任意)</label>
              <input
                v-model="newCustomItem.initialStock"
                type="number"
                min="0"
                placeholder="未設定(無限)"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div class="sm:col-span-2">
              <button
                @click="addCustomItem"
                class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-xs transition cursor-pointer"
              >
                ＋ 追加する
              </button>
            </div>
          </div>
        </div>

        <!-- 全商品の在庫・頒布状況テーブル -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-xs space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-base md:text-lg font-extrabold text-slate-800">📦 商品別 在庫・頒布数管理</h2>
              <p class="text-xs text-slate-500">初期在庫の設定、数え間違い・追加搬入による「現在の残数」の直接修正、手動完売の切り替えができます。</p>
            </div>
          </div>

          <div class="divide-y divide-slate-200">
            <div
              v-for="product in allProducts"
              :key="'inv_' + product.id"
              class="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              <!-- 商品基本情報 -->
              <div class="min-w-0 flex-1 space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span v-if="product.isCustom" class="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">当日追加</span>
                  <span v-else class="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">お品書き連携</span>
                  <span class="font-extrabold text-base text-slate-900">{{ product.name }}</span>
                  <span class="font-mono font-black text-sm text-blue-700">¥{{ product.price.toLocaleString() }}</span>
                  <span v-if="product.isSoldOut" class="text-xs font-black bg-rose-600 text-white px-2 py-0.5 rounded-md">💔 完売中</span>
                  <span v-else-if="product.isLowStock" class="text-xs font-extrabold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">⚠️ 残りわずか</span>
                </div>
                <div class="text-xs text-slate-500 flex items-center gap-4">
                  <span>累計頒布数: <strong class="font-mono text-slate-800">{{ product.soldCount }}点</strong></span>
                  <span>売上小計: <strong class="font-mono text-slate-800">¥{{ (product.soldCount * product.price).toLocaleString() }}</strong></span>
                </div>
              </div>

              <!-- 在庫コントロール群 -->
              <div class="flex flex-wrap items-center gap-2.5">
                <!-- 初期在庫数入力 -->
                <div class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
                  <label class="text-xs font-bold text-slate-600">初期在庫:</label>
                  <input
                    type="number"
                    min="0"
                    :value="product.initialStock !== null ? product.initialStock : ''"
                    @change="e => updateInitialStock(product, e.target.value)"
                    placeholder="未設定"
                    class="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm text-center"
                  />
                </div>

                <!-- 現在の残数 直接修正ステッパー (初期在庫が設定されている場合) -->
                <div v-if="product.initialStock !== null" class="bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                  <span class="text-xs font-bold text-emerald-900">現在残数:</span>
                  <button
                    @click="adjustRemainingStock(product, -1)"
                    class="w-7 h-7 rounded-lg bg-white border border-emerald-300 font-black text-emerald-900 hover:bg-emerald-100 cursor-pointer"
                    title="残数を1減らす（搬入数訂正）"
                  >
                    －
                  </button>
                  <input
                    type="number"
                    min="0"
                    :value="product.remainingStock"
                    @change="e => setExactRemainingStock(product, e.target.value)"
                    class="w-16 px-1.5 py-1 bg-white border border-emerald-300 rounded-lg font-mono font-black text-sm text-center text-emerald-950"
                  />
                  <button
                    @click="adjustRemainingStock(product, 1)"
                    class="w-7 h-7 rounded-lg bg-white border border-emerald-300 font-black text-emerald-900 hover:bg-emerald-100 cursor-pointer"
                    title="残数を1増やす（追加搬入・数え間違い訂正）"
                  >
                    ＋
                  </button>
                </div>

                <!-- 手動完売トグル -->
                <button
                  @click="toggleManualSoldOut(product)"
                  class="px-3 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer"
                  :class="product.manualSoldOut
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-700'"
                >
                  {{ product.manualSoldOut ? '💔 手動完売中 (タップで解除)' : '手動で完売にする' }}
                </button>

                <!-- 当日追加商品の削除ボタン -->
                <button
                  v-if="product.isCustom"
                  @click="removeCustomItem(product.id)"
                  class="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                  title="この当日追加商品を削除"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- =========================================================
         3. 売上集計・会計履歴タブ
    ========================================================== -->
    <div v-else-if="subTab === 'history'" class="flex-1 overflow-y-auto p-3 md:p-6 pb-24 space-y-5">
      <div class="max-w-5xl mx-auto space-y-5">
        
        <!-- 売上サマリーカード群 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div class="text-xs font-bold text-slate-500">本日の売上合計</div>
            <div class="text-2xl md:text-3xl font-black font-mono text-blue-700 mt-1">
              ¥{{ totalSalesAmount.toLocaleString() }}
            </div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div class="text-xs font-bold text-slate-500">総頒布点数</div>
            <div class="text-2xl md:text-3xl font-black font-mono text-slate-900 mt-1">
              {{ totalSoldItemsCount }} <span class="text-sm font-bold text-slate-500">点</span>
            </div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <div class="text-xs font-bold text-slate-500">会計完了組数</div>
              <div class="text-2xl md:text-3xl font-black font-mono text-emerald-700 mt-1">
                {{ validTransactions.length }} <span class="text-sm font-bold text-slate-500">組</span>
              </div>
            </div>
            <button
              @click="copySalesSummaryToClipboard"
              class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer"
            >
              📋 集計レポートをコピー
            </button>
          </div>
        </div>

        <!-- 商品別 頒布内訳 -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-xs space-y-3">
          <h3 class="text-base font-extrabold text-slate-800">📊 商品別 頒布・売上内訳</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <div
              v-for="product in allProducts"
              :key="'stat_' + product.id"
              class="border border-slate-200 rounded-xl p-3 flex items-center justify-between bg-slate-50/60"
            >
              <div class="min-w-0 pr-2">
                <div class="font-bold text-sm text-slate-800 truncate">{{ product.name }}</div>
                <div class="text-xs text-slate-500 font-mono">
                  @¥{{ product.price.toLocaleString() }}
                  <span v-if="product.initialStock !== null"> / 残{{ product.remainingStock }}</span>
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="font-mono font-black text-sm text-slate-900">{{ product.soldCount }}点</div>
                <div class="font-mono font-bold text-xs text-blue-700">¥{{ (product.soldCount * product.price).toLocaleString() }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 会計ごとの履歴一覧（時刻＋明細＋取消） -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-extrabold text-slate-800">🕒 会計履歴（最新順）</h3>
            <span class="text-xs text-slate-500">打ち間違い時は「取消」で在庫が元に戻ります</span>
          </div>

          <div v-if="registerState.transactions.length === 0" class="py-8 text-center text-slate-400 text-sm font-bold">
            まだ本日の会計履歴はありません
          </div>

          <div v-else class="divide-y divide-slate-200">
            <div
              v-for="tx in registerState.transactions"
              :key="tx.id"
              class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              :class="tx.voided ? 'opacity-50 bg-slate-50 px-2 rounded-lg' : ''"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {{ formatTime(tx.timestamp) }}
                  </span>
                  <span v-if="tx.voided" class="text-[11px] font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded">
                    取消済
                  </span>
                  <span class="font-mono font-black text-base" :class="tx.voided ? 'line-through text-slate-400' : 'text-slate-900'">
                    ¥{{ tx.total.toLocaleString() }}
                  </span>
                  <span class="text-xs text-slate-400 font-mono">
                    (預かり ¥{{ tx.deposit.toLocaleString() }} / 釣 ¥{{ tx.change.toLocaleString() }})
                  </span>
                </div>
                <div class="text-xs font-bold text-slate-700 flex flex-wrap gap-1.5">
                  <span
                    v-for="(item, idx) in tx.items"
                    :key="tx.id + '_' + idx"
                    class="bg-blue-50 text-blue-900 border border-blue-200/80 px-2 py-0.5 rounded-md"
                  >
                    {{ item.name }} ×{{ item.qty }}
                  </span>
                </div>
              </div>

              <div class="shrink-0">
                <button
                  v-if="!tx.voided"
                  @click="confirmVoidTransaction(tx)"
                  class="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
                >
                  会計取消 (在庫を戻す)
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- =========================================================
         クイック商品追加モーダル (レジ画面から離れずにその場で追加)
    ========================================================== -->
    <div
      v-if="showQuickAddModal"
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      @click.self="showQuickAddModal = false"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b pb-2.5">
          <h3 class="font-extrabold text-base text-slate-800">➕ 当日商品の個人追加</h3>
          <button @click="showQuickAddModal = false" class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">×</button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">商品名</label>
            <input
              v-model="newCustomItem.name"
              type="text"
              placeholder="例: 当日朝追加 色紙"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">頒布価格 (円)</label>
              <input
                v-model.number="newCustomItem.price"
                type="number"
                min="0"
                step="100"
                placeholder="2000"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">初期在庫数 (任意)</label>
              <input
                v-model="newCustomItem.initialStock"
                type="number"
                min="0"
                placeholder="未設定(無制限)"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <p class="text-[11px] text-slate-500">
            ※ この商品はレジ専用データ（`register_data`）にのみ保存され、一般公開のお品書き（`circle_info`）には影響しません。
          </p>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button
            @click="showQuickAddModal = false"
            class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
          >
            キャンセル
          </button>
          <button
            @click="addCustomItemAndCloseModal"
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm cursor-pointer"
          >
            ＋ レジに追加する
          </button>
        </div>
      </div>
    </div>

    <!-- 会計完了ミニフィードバックトースト -->
    <div
      v-if="checkoutFeedbackText"
      class="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-extrabold text-sm px-5 py-2.5 rounded-full shadow-xl z-50 flex items-center gap-2 animate-bounce"
    >
      <span>✅</span>
      <span>{{ checkoutFeedbackText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { supabaseClient } from '../supabase';

const props = defineProps({
  circle: {
    type: Object,
    default: null
  },
  circleExtra: {
    type: Object,
    default: null
  },
  user: {
    type: Object,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  circleId: {
    type: String,
    default: '10ebdde686d91dfe1ab4a63376c7b377' // M-15-16 Black Stance
  }
});

const LOW_STOCK_THRESHOLD = 5;

const subTab = ref('pos');
const showQuickAddModal = ref(false);
const isSyncing = ref(false);
const hasPendingSync = ref(false);
const checkoutFeedbackText = ref('');
let feedbackTimer = null;
let cloudSyncTimer = null;

// ローカルストレージキー
const localStorageKey = computed(() => `vggc12th_register_state_${props.circleId}`);

// レジの永続化ステート
const registerState = ref({
  revision: 0,
  updatedAt: null,
  itemOverrides: {}, // { [productId]: { initialStock: number|null, soldCount: number, manualSoldOut: boolean } }
  customItems: [],   // [{ id, name, price, initialStock, soldCount, manualSoldOut }]
  transactions: []   // [{ id, timestamp, items: [{ id, name, price, qty }], total, deposit, change, voided }]
});

// 現在の会計カート: { [productId]: qty }
const cart = ref({});
const depositAmount = ref(0);

const depositInputModel = computed({
  get: () => (depositAmount.value > 0 ? depositAmount.value : ''),
  set: (val) => {
    const num = Number(val);
    depositAmount.value = Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0;
  }
});

// 当日追加フォーム用
const newCustomItem = ref({
  name: '',
  price: 1000,
  initialStock: ''
});

// サークル表示名・スペース番号
const circleName = computed(() => props.circle?.circle_name || 'Black Stance');
const circleSpaceLabel = computed(() => {
  if (props.circle?.space_sym && props.circle?.space_num) {
    return `${props.circle.space_sym}-${props.circle.space_num}`;
  }
  return 'M-15-16';
});

// 1. circle_info.items (基本商品) と customItems (当日個人追加商品) を統合した全商品リスト
const allProducts = computed(() => {
  const baseRawItems = Array.isArray(props.circleExtra?.items) ? props.circleExtra.items : [];
  const overrides = registerState.value.itemOverrides || {};

  const baseProducts = baseRawItems.map((raw, idx) => {
    const name = String(raw.name || `頒布物 #${idx + 1}`).trim();
    const price = Math.max(0, Number(raw.price) || 0);
    const id = `base_${name}_${price}`;
    const ov = overrides[id] || {};
    const initialStock = ov.initialStock !== undefined && ov.initialStock !== null && ov.initialStock !== ''
      ? Number(ov.initialStock)
      : null;
    const soldCount = Math.max(0, Number(ov.soldCount) || 0);
    const manualSoldOut = Boolean(ov.manualSoldOut);
    const remainingStock = initialStock !== null ? Math.max(0, initialStock - soldCount) : null;
    const isSoldOut = manualSoldOut || (remainingStock !== null && remainingStock <= 0);
    const isLowStock = !isSoldOut && remainingStock !== null && remainingStock <= LOW_STOCK_THRESHOLD;

    return {
      id,
      name,
      price,
      isCustom: false,
      initialStock,
      soldCount,
      remainingStock,
      manualSoldOut,
      isSoldOut,
      isLowStock
    };
  });

  const customProducts = (registerState.value.customItems || []).map((custom) => {
    const initialStock = custom.initialStock !== undefined && custom.initialStock !== null && custom.initialStock !== ''
      ? Number(custom.initialStock)
      : null;
    const soldCount = Math.max(0, Number(custom.soldCount) || 0);
    const manualSoldOut = Boolean(custom.manualSoldOut);
    const remainingStock = initialStock !== null ? Math.max(0, initialStock - soldCount) : null;
    const isSoldOut = manualSoldOut || (remainingStock !== null && remainingStock <= 0);
    const isLowStock = !isSoldOut && remainingStock !== null && remainingStock <= LOW_STOCK_THRESHOLD;

    return {
      id: custom.id,
      name: custom.name,
      price: Math.max(0, Number(custom.price) || 0),
      isCustom: true,
      initialStock,
      soldCount,
      remainingStock,
      manualSoldOut,
      isSoldOut,
      isLowStock
    };
  });

  return [...baseProducts, ...customProducts];
});

// 残りわずか・完売商品の件数
const lowStockItemsCount = computed(() => {
  return allProducts.value.filter(p => p.isSoldOut || p.isLowStock).length;
});

// カート内の明細一覧
const cartItems = computed(() => {
  const list = [];
  for (const product of allProducts.value) {
    const qty = cart.value[product.id] || 0;
    if (qty > 0) {
      list.push({ product, qty });
    }
  }
  return list;
});

const cartTotalCount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.qty, 0);
});

const cartTotalAmount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.product.price * item.qty, 0);
});

const changeAmount = computed(() => {
  if (cartTotalAmount.value === 0) return 0;
  if (depositAmount.value === 0) return 0; // 未入力時は「ちょうど」扱い
  return depositAmount.value - cartTotalAmount.value;
});

const canCompleteCheckout = computed(() => {
  if (cartTotalCount.value <= 0) return false;
  if (depositAmount.value > 0 && depositAmount.value < cartTotalAmount.value) return false;
  return true;
});

// 有効な売上履歴（取消済みを除く）
const validTransactions = computed(() => {
  return (registerState.value.transactions || []).filter(tx => !tx.voided);
});

const lastValidTransaction = computed(() => {
  return validTransactions.value.length > 0 ? validTransactions.value[0] : null;
});

const totalSalesAmount = computed(() => {
  return validTransactions.value.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
});

const totalSoldItemsCount = computed(() => {
  return validTransactions.value.reduce((sum, tx) => {
    const pts = (tx.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0);
    return sum + pts;
  }, 0);
});

// =========================================================
// カート・会計アクション
// =========================================================
const getCartQty = (productId) => cart.value[productId] || 0;

const canAddMoreToCart = (product) => {
  if (!product || product.isSoldOut) return false;
  const currentQty = getCartQty(product.id);
  if (product.remainingStock !== null && currentQty >= product.remainingStock) {
    return false;
  }
  return true;
};

const handleProductCardTap = (product) => {
  if (!canAddMoreToCart(product)) return;
  cart.value[product.id] = (cart.value[product.id] || 0) + 1;
};

const changeCartQty = (productId, delta) => {
  const product = allProducts.value.find(p => p.id === productId);
  if (!product) return;
  const next = (cart.value[productId] || 0) + delta;
  if (next <= 0) {
    delete cart.value[productId];
  } else if (product.remainingStock === null || next <= product.remainingStock) {
    cart.value[productId] = next;
  }
};

const clearCart = () => {
  cart.value = {};
  depositAmount.value = 0;
};

const setExactDeposit = () => {
  depositAmount.value = cartTotalAmount.value;
};

const addDeposit = (amount) => {
  depositAmount.value = (depositAmount.value || 0) + amount;
};

const getProductCardClass = (product) => {
  const qty = getCartQty(product.id);
  if (product.isSoldOut) {
    return 'bg-slate-100 border-slate-300 opacity-70 cursor-not-allowed';
  }
  if (qty > 0) {
    return 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-400/50 cursor-pointer active:scale-99';
  }
  if (product.isLowStock) {
    return 'bg-amber-50/70 border-amber-400 hover:border-amber-500 cursor-pointer active:scale-99';
  }
  return 'bg-white border-slate-200 hover:border-blue-400 cursor-pointer active:scale-99';
};

// 会計確定処理
const completeCheckout = () => {
  if (!canCompleteCheckout.value) return;

  const total = cartTotalAmount.value;
  const actualDeposit = depositAmount.value > 0 ? depositAmount.value : total;
  const change = actualDeposit - total;
  const txItems = [];

  // 各商品の頒布数(soldCount)を加算
  for (const { product, qty } of cartItems.value) {
    txItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty
    });

    if (product.isCustom) {
      const target = registerState.value.customItems.find(c => c.id === product.id);
      if (target) {
        target.soldCount = (Number(target.soldCount) || 0) + qty;
      }
    } else {
      if (!registerState.value.itemOverrides[product.id]) {
        registerState.value.itemOverrides[product.id] = {
          initialStock: product.initialStock,
          soldCount: 0,
          manualSoldOut: false
        };
      }
      registerState.value.itemOverrides[product.id].soldCount =
        (Number(registerState.value.itemOverrides[product.id].soldCount) || 0) + qty;
    }
  }

  // トランザクション履歴の先頭に追加
  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    items: txItems,
    total,
    deposit: actualDeposit,
    change,
    voided: false
  };

  registerState.value.transactions.unshift(tx);

  // カートリセット & 保存
  clearCart();
  commitRegisterState();

  // トースト通知
  showFeedback(`会計完了 ¥${total.toLocaleString()} ${change > 0 ? `(お釣り ¥${change.toLocaleString()})` : ''}`);
};

// 会計取消 (在庫を戻す)
const confirmVoidTransaction = (tx) => {
  if (!tx || tx.voided) return;
  if (!window.confirm(`【会計取消】\n${formatTime(tx.timestamp)} の会計（¥${tx.total.toLocaleString()}）を取り消し、在庫数を元に戻しますか？`)) {
    return;
  }

  tx.voided = true;

  for (const item of tx.items || []) {
    const customTarget = registerState.value.customItems.find(c => c.id === item.id);
    if (customTarget) {
      customTarget.soldCount = Math.max(0, (Number(customTarget.soldCount) || 0) - item.qty);
    } else if (registerState.value.itemOverrides[item.id]) {
      registerState.value.itemOverrides[item.id].soldCount = Math.max(
        0,
        (Number(registerState.value.itemOverrides[item.id].soldCount) || 0) - item.qty
      );
    }
  }

  commitRegisterState();
  showFeedback(`会計（¥${tx.total.toLocaleString()}）を取り消し、在庫を戻しました`);
};

// =========================================================
// 在庫管理・当日商品追加・売り切れトグル
// =========================================================
const ensureOverrideEntry = (product) => {
  if (!registerState.value.itemOverrides[product.id]) {
    registerState.value.itemOverrides[product.id] = {
      initialStock: product.initialStock,
      soldCount: product.soldCount || 0,
      manualSoldOut: product.manualSoldOut || false
    };
  }
  return registerState.value.itemOverrides[product.id];
};

const toggleManualSoldOut = (product) => {
  if (product.isCustom) {
    const target = registerState.value.customItems.find(c => c.id === product.id);
    if (target) {
      target.manualSoldOut = !target.manualSoldOut;
      if (target.manualSoldOut) delete cart.value[product.id];
    }
  } else {
    const ov = ensureOverrideEntry(product);
    ov.manualSoldOut = !ov.manualSoldOut;
    if (ov.manualSoldOut) delete cart.value[product.id];
  }
  commitRegisterState();
};

const updateInitialStock = (product, rawVal) => {
  const trimmed = String(rawVal).trim();
  const parsed = trimmed === '' ? null : Math.max(0, Math.floor(Number(trimmed)));

  if (product.isCustom) {
    const target = registerState.value.customItems.find(c => c.id === product.id);
    if (target) target.initialStock = Number.isFinite(parsed) ? parsed : null;
  } else {
    const ov = ensureOverrideEntry(product);
    ov.initialStock = Number.isFinite(parsed) ? parsed : null;
  }
  commitRegisterState();
};

const adjustRemainingStock = (product, delta) => {
  if (product.initialStock === null) return;
  const newRemaining = Math.max(0, product.remainingStock + delta);
  setExactRemainingStock(product, newRemaining);
};

const setExactRemainingStock = (product, rawRemaining) => {
  const desiredRemaining = Math.max(0, Math.floor(Number(rawRemaining) || 0));
  const newInitial = desiredRemaining + product.soldCount;
  updateInitialStock(product, newInitial);
};

const openQuickAddItemModal = () => {
  newCustomItem.value = { name: '', price: 1000, initialStock: '' };
  showQuickAddModal.value = true;
};

const addCustomItem = () => {
  const name = String(newCustomItem.value.name || '').trim();
  if (!name) {
    alert('商品名を入力してください。');
    return false;
  }
  const price = Math.max(0, Math.floor(Number(newCustomItem.value.price) || 0));
  const rawStock = String(newCustomItem.value.initialStock ?? '').trim();
  const initialStock = rawStock === '' ? null : Math.max(0, Math.floor(Number(rawStock)));

  registerState.value.customItems.push({
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    name,
    price,
    initialStock: Number.isFinite(initialStock) ? initialStock : null,
    soldCount: 0,
    manualSoldOut: false
  });

  newCustomItem.value = { name: '', price: 1000, initialStock: '' };
  commitRegisterState();
  showFeedback(`「${name}」を追加しました`);
  return true;
};

const addCustomItemAndCloseModal = () => {
  if (addCustomItem()) {
    showQuickAddModal.value = false;
  }
};

const removeCustomItem = (customId) => {
  const target = registerState.value.customItems.find(c => c.id === customId);
  if (!target) return;
  if (!window.confirm(`当日追加商品「${target.name}」を削除しますか？`)) return;
  registerState.value.customItems = registerState.value.customItems.filter(c => c.id !== customId);
  delete cart.value[customId];
  commitRegisterState();
};

// =========================================================
// オフラインファースト保存 ＆ Supabase register_data 同期
// =========================================================
const saveToLocalCache = () => {
  try {
    localStorage.setItem(localStorageKey.value, JSON.stringify({
      ...registerState.value,
      pendingSync: hasPendingSync.value
    }));
  } catch (e) {
    console.warn('Register localStorage save failed:', e);
  }
};

const loadFromLocalCache = () => {
  try {
    const raw = localStorage.getItem(localStorageKey.value);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      registerState.value = {
        revision: Number(parsed.revision) || 0,
        updatedAt: parsed.updatedAt || null,
        itemOverrides: parsed.itemOverrides || {},
        customItems: Array.isArray(parsed.customItems) ? parsed.customItems : [],
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
      };
      hasPendingSync.value = Boolean(parsed.pendingSync);
      return true;
    }
  } catch (e) {
    console.warn('Register localStorage restore error:', e);
  }
  return false;
};

const commitRegisterState = () => {
  registerState.value.revision = (Number(registerState.value.revision) || 0) + 1;
  registerState.value.updatedAt = new Date().toISOString();
  hasPendingSync.value = true;
  saveToLocalCache();
  scheduleCloudSync();
};

const scheduleCloudSync = () => {
  if (!props.user || !props.isOnline) return;
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    pushStateToCloud();
  }, 1200);
};

const pushStateToCloud = async () => {
  if (!props.user || !props.isOnline) return;
  isSyncing.value = true;
  try {
    const payload = {
      user_id: props.user.id,
      circle_id: props.circleId,
      state_data: {
        revision: registerState.value.revision,
        updatedAt: registerState.value.updatedAt,
        itemOverrides: registerState.value.itemOverrides,
        customItems: registerState.value.customItems,
        transactions: registerState.value.transactions
      },
      updated_at: new Date().toISOString()
    };

    const upsertPromise = supabaseClient
      .from('register_data')
      .upsert(payload, { onConflict: 'user_id' });
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ error: 'TIMEOUT' }), 3500));
    const { error } = await Promise.race([upsertPromise, timeoutPromise]);

    if (!error) {
      hasPendingSync.value = false;
      saveToLocalCache();
    } else {
      console.warn('Register cloud sync deferred:', error);
    }
  } catch (e) {
    console.warn('Register cloud sync exception:', e);
  } finally {
    isSyncing.value = false;
  }
};

// クラウドからの読み込み＆リビジョン比較マージ（オフライン中の売上消失を100%防止）
const syncWithCloudOnInitOrOnline = async () => {
  if (!props.user || !props.isOnline) return;
  isSyncing.value = true;
  try {
    const fetchPromise = supabaseClient
      .from('register_data')
      .select('*')
      .eq('user_id', props.user.id)
      .maybeSingle();
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ error: 'TIMEOUT', data: null }), 3000));
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.warn('register_data fetch skipped (table not created yet or offline):', error);
      return;
    }

    if (!data) {
      // まだ行が存在しない場合は現在のローカル状態で初期行を作成
      await pushStateToCloud();
      return;
    }

    const cloudState = data.state_data || {};
    const cloudRev = Number(cloudState.revision) || 0;
    const localRev = Number(registerState.value.revision) || 0;

    if (cloudRev > localRev && !hasPendingSync.value) {
      // クラウドの方が新しい場合のみクラウドを採用
      registerState.value = {
        revision: cloudRev,
        updatedAt: cloudState.updatedAt || data.updated_at,
        itemOverrides: cloudState.itemOverrides || {},
        customItems: Array.isArray(cloudState.customItems) ? cloudState.customItems : [],
        transactions: Array.isArray(cloudState.transactions) ? cloudState.transactions : []
      };
      hasPendingSync.value = false;
      saveToLocalCache();
    } else if (localRev > cloudRev || hasPendingSync.value) {
      // ローカルの方が進んでいる場合（圏外で会計を進めた後など）はローカルをクラウドへPush
      await pushStateToCloud();
    }
  } catch (e) {
    console.warn('syncWithCloudOnInitOrOnline error:', e);
  } finally {
    isSyncing.value = false;
  }
};

// ユーティリティ
const formatTime = (isoStr) => {
  if (!isoStr) return '--:--';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return '--:--';
  }
};

const showFeedback = (msg) => {
  checkoutFeedbackText.value = msg;
  if (feedbackTimer) clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    checkoutFeedbackText.value = '';
  }, 2400);
};

const copySalesSummaryToClipboard = async () => {
  const lines = [
    `【${circleSpaceLabel.value} ${circleName.value} 売上集計レポート】`,
    `出力日時: ${new Date().toLocaleString('ja-JP')}`,
    `本日売上合計: ¥${totalSalesAmount.value.toLocaleString()}`,
    `総頒布点数: ${totalSoldItemsCount.value}点 (${validTransactions.value.length}組)`,
    `----------------------------------------`,
    `■ 商品別内訳:`
  ];
  for (const p of allProducts.value) {
    const remStr = p.initialStock !== null ? ` (残${p.remainingStock}/${p.initialStock})` : '';
    lines.push(`・${p.name}: ${p.soldCount}点 / ¥${(p.soldCount * p.price).toLocaleString()}${remStr}`);
  }
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    showFeedback('売上レポートをクリップボードにコピーしました！');
  } catch (e) {
    alert(lines.join('\n'));
  }
};

watch(() => props.isOnline, (online) => {
  if (online) {
    syncWithCloudOnInitOrOnline();
  }
});

watch(() => props.user, (newUser) => {
  if (newUser && props.isOnline) {
    syncWithCloudOnInitOrOnline();
  }
});

onMounted(() => {
  loadFromLocalCache();
  if (props.user && props.isOnline) {
    syncWithCloudOnInitOrOnline();
  }
});
</script>
