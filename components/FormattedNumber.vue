<template>{{ formattedNumber }}</template>
<script lang="ts" setup>
const props = defineProps({
  value: {
    type: [Number, String],
    required: true
  },
  digits: {
    type: Number,
    default: 0
  }
});

const formattedNumber = computed(() => {
  const value = parseFloat(props.value.toString());
  if (isNaN(value)) return '';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: props.digits,
    maximumFractionDigits: props.digits
  });
});
</script>