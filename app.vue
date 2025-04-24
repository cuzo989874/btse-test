<template>
  <section class="order-book">
    <div class="order-book__header">Order Book</div>
    <table class="quote-table">
      <thead>
        <tr>
          <th class="cell text-left">Price (USD)</th>
          <th class="cell text-right">Size</th>
          <th class="cell text-right">Total</th>
        </tr>
      </thead>
      <tbody class="quote-table__body">
        <tr
          v-for="(
            {
              price,
              size,
              dependencySum,
              dependencyPercentage,
              isNew,
              sizeCompare,
            },
            index
          ) of asksWithSum"
          :key="index"
          :class="{ 'new-order--sell': isNew }"
        >
          <td class="cell text-left text-sell">
            <formattedNumber :value="price" :digits="1" />
          </td>
          <td class="cell text-right" :class="`size--${sizeCompare}`">
            <formattedNumber :value="size" />
          </td>
          <td class="cell text-right">
            <div
              class="quote-table__sum-percentage quote-table__sum-percentage--sell"
              :data-percentage="100 - dependencyPercentage * 100"
            />
            <span><formattedNumber :value="dependencySum" /></span>
          </td>
        </tr>
      </tbody>
      <last-price-table />
      <tbody class="quote-table__body">
        <tr
          v-for="(
            {
              price,
              size,
              dependencySum,
              dependencyPercentage,
              isNew,
              sizeCompare,
            },
            index
          ) of bidsWithSum"
          :key="index"
          :class="{ 'new-order--buy': isNew }"
        >
          <td class="cell text-left text-buy">
            <formattedNumber :value="price" :digits="1" />
          </td>
          <td class="cell text-right" :class="`size--${sizeCompare}`">
            <formattedNumber :value="size" />
          </td>
          <td class="cell text-right">
            <div
              class="quote-table__sum-percentage quote-table__sum-percentage--buy"
              :data-percentage="100 - dependencyPercentage * 100"
            />
            <span><formattedNumber :value="dependencySum" /></span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
<script lang="ts" setup>
import OrderBook from "./server/websocket/OrderBook";

import type IStoreOrder from "./shared/interface/IStoreOrder";

import FormattedNumber from "./components/FormattedNumber.vue";
import LastPriceTable from "./components/LastPriceTable.vue";

interface IOrder extends IStoreOrder {
  dependencySum: number;
  dependencyPercentage: number;
}

const bidsWithSum = ref<IOrder[]>([]);
const asksWithSum = ref<IOrder[]>([]);

OrderBook.init((storeBids, storeAsks) => {
  const accBids = sum(storeBids);
  const accAsks = sum(storeAsks);

  bidsWithSum.value = storeBids.map(
    ({ price, size, isNew, sizeCompare }, index) => {
      const sumAbove = sum(storeBids.slice(0, index + 1));

      return {
        price,
        size,
        isNew,
        sizeCompare,
        dependencySum: sumAbove,
        dependencyPercentage: sumAbove / accBids,
      };
    }
  );
  asksWithSum.value = storeAsks.map(
    ({ price, size, isNew, sizeCompare }, index) => {
      const sumBelow = sum(storeAsks.slice(index, storeAsks.length));

      return {
        price,
        size,
        isNew,
        sizeCompare,
        dependencySum: sumBelow,
        dependencyPercentage: sumBelow / accAsks,
      };
    }
  );
});

function sum(entries: IStoreOrder[]) {
  return entries.reduce((acc, { size }) => {
    return acc + Number(size);
  }, 0);
}

onUnmounted(() => {
  OrderBook.close();
});
</script>
<style lang="scss">
@use "~/assets/style/variables";

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.text-buy {
  color: variables.$buyQuotePriceTextColor;
}

.text-sell {
  color: variables.$sellQuotePriceTextColor;
}

.order-book {
  background-color: variables.$backgroundColor;
  color: variables.$defaultTextColor;
  max-width: 320px;
  margin: 64px auto;
  box-shadow: 0px 0px 16px 16px variables.$backgroundColor;

  &__header {
    padding: variables.$gap;
    border-bottom: 1px solid rgba(white, 0.12);
    font-weight: 600;
  }
}

.quote-table {
  width: 100%;
  background-color: variables.$backgroundColor;
  color: variables.$defaultTextColor;
  font-size: 0.75em;
  border-spacing: 0;

  thead {
    color: variables.$quoteTableHeadTextColor;
    font-weight: bold;
  }

  tbody .cell {
    position: relative;
    cursor: pointer;
    z-index: 1;
    font-weight: 600;
  }

  &__body > tr {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      transition: background-color .2s;
    }

    &:hover::after {
      background-color: variables.$quoteRowHoverBackgroundColor;
    }
  }

  .cell {
    position: relative;
    width: calc(100% / 3);
    padding: calc(variables.$gap / 2) variables.$gap;
    border: 0;
  }

  &__sum-percentage {
    position: absolute;
    top: 0;
    bottom: 0;
    left: attr(data-percentage %);
    right: 0;

    & + span {
      position: relative;
      z-index: 1;
    }

    &--buy {
      background-color: variables.$buyQuoteAccumulativeTotalSizeBarColor;
    }

    &--sell {
      background-color: variables.$sellQuoteAccumulativeTotalSizeBarColor;
    }
  }

  .new-order {
    &--buy {
      animation: ease-in-out FlashGreenBg 0.3s;
    }
    &--sell {
      animation: ease-in-out FlashRedBg 0.3s;
    }
  }
  .size {
    &--greater {
      animation: ease-in-out FlashGreenBg 0.5s;
    }
    &--less {
      animation: ease-in-out FlashRedBg 0.5s;
    }
  }
}

@keyframes FlashGreenBg {
  0% {
    background-color: #0000;
  }
  15% {
    background-color: variables.$animationFlashGreenBackgroundColor;
  }
  100% {
    background-color: #0000;
  }
}
@keyframes FlashRedBg {
  0% {
    background-color: #0000;
  }
  15% {
    background-color: variables.$animationFlashRedBackgroundColor;
  }
  100% {
    background-color: #0000;
  }
}
</style>
