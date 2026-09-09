import { createApp, ref, h } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import KeyValueEditor from '../../src/components/KeyValueEditor.vue'
import ValueView from '../../src/components/ValueView.vue'
import ConfigProvider from '../../src/components/ConfigProvider.vue'
createApp({ setup() {
  const data = ref({ count: 0, enabled: false, missing: null, nested: { code: 'keep' }, items: [0, false, null] })
  const valid = ref(true), saved = ref('')
  return () => h(ConfigProvider, {}, { default: () => [
    h('h1', '字段编辑行为验证'),
    h(KeyValueEditor, { modelValue: data.value, label: '变量', 'onUpdate:modelValue': (next: any) => { data.value = next }, onValidity: (next: boolean) => { valid.value = next } }),
    h('button', { disabled: !valid.value, onClick: () => { saved.value = JSON.stringify(data.value) } }, '保存'),
    h('output', { 'aria-label': '保存结果' }, saved.value),
    h('section', { 'aria-label': '只读内容' }, [h(ValueView, { value: JSON.stringify(data.value) })]),
  ] })
} }).use(ElementPlus).mount('#fixture')
