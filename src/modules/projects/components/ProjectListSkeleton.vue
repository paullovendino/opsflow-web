<template>
  <div class="flex flex-col gap-4" aria-busy="true" aria-live="polite">
    <div class="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
    <div class="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
      <div v-for="index in 6" :key="index" class="h-12 animate-pulse border-b border-slate-100 bg-slate-50" />
    </div>
    <div class="flex flex-col gap-3 md:hidden">
      <div
        v-for="index in 4"
        :key="`card-${index}`"
        class="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
      />
    </div>
  </div>
</template>
