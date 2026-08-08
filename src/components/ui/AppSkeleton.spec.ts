import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppTableSkeleton from '@/components/ui/AppTableSkeleton.vue'
import AppCardSkeleton from '@/components/ui/AppCardSkeleton.vue'
import AppDetailSkeleton from '@/components/ui/AppDetailSkeleton.vue'
import AppReportSkeleton from '@/components/ui/AppReportSkeleton.vue'

describe('skeleton components', () => {
  it('marks table, card, detail, and report skeletons as busy', () => {
    expect(mount(AppTableSkeleton).attributes('aria-busy')).toBe('true')
    expect(mount(AppCardSkeleton).attributes('aria-busy')).toBe('true')
    expect(mount(AppDetailSkeleton).attributes('aria-busy')).toBe('true')
    expect(mount(AppReportSkeleton).attributes('aria-busy')).toBe('true')
  })

  it('renders the primitive skeleton placeholder', () => {
    const wrapper = mount(AppSkeleton)
    expect(wrapper.classes().join(' ')).toContain('opsflow-skeleton')
  })
})
