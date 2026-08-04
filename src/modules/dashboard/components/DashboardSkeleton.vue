<template>
  <div class="flex flex-col gap-6" aria-busy="true" aria-live="polite">
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="index in 4"
        :key="`stat-${index}`"
        class="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
      />
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="h-56 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      <div class="h-56 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
    </div>

    <div class="h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
    <div class="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
  </div>
</template>
