<template>
  <tbody>
    <tr>
      <td colspan="3">
        <div class="last-price" :class="`last-price--${lastPriceCompare}`">
          <div class="last-price__content">
            <formattedNumber
              v-if="lastPriceAmount"
              :value="lastPriceAmount"
              :digits="1"
            />
            <img
              v-if="lastPriceCompare === 'greater'"
              src="~/public/arrow_upward.svg"
              alt="Arrow Upward"
              width="16px"
            >
            <img
              v-else-if="lastPriceCompare === 'less'"
              src="~/public/arrow_downward.svg"
              alt="Arrow Downward"
              width="16px"
            >
          </div>
        </div>
      </td>
    </tr>
  </tbody>
</template>
<script lang="ts" setup>
import LastPrice from '~/server/websocket/LastPrice';
import type TCompareStatus from '~/shared/type/TCompareStatus';

const lastPriceAmount = ref(0);
const lastPriceCompare = ref<TCompareStatus>("equal");

LastPrice.init((price, compare) => {
  lastPriceAmount.value = price;
  lastPriceCompare.value = compare;
});

onUnmounted(() => {
  LastPrice.close();
});
</script>
<style lang="scss">
@use "~/assets/style/variables";

.last-price {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: calc(2ex + variables.$gap * 1.5);
  background-color: rgba(variables.$quoteTableHeadTextColor, 0.12);
  padding: 0 calc(variables.$gap / 2);
  font-size: 1.4em;
  font-weight: bold;

  &--greater {
    color: variables.$buyQuotePriceTextColor;
    background-color: variables.$BuyQuoteAccumulativeTotalSizeBarColor;
  }

  &--less {
    color: variables.$sellQuotePriceTextColor;
    background-color: variables.$SellQuoteAccumulativeTotalSizeBarColor;
  }

  &__content {
    position: relative;
    display: flex;

    & > img {
      position: absolute;
      right: calc(-16px - variables.$gap / 2);
      top: calc(50% - 8px);
    }
  }
}
</style>