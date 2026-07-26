import { createApp } from 'vue'
import { ElButton, ElPopover, ElTag } from 'element-plus'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-button.css'
import 'element-plus/theme-chalk/el-popper.css'
import 'element-plus/theme-chalk/el-popover.css'
import 'element-plus/theme-chalk/el-tag.css'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import './style.css'
import App from './App.vue'

createApp(App)
  .use(ElButton)
  .use(ElPopover)
  .use(ElTag)
  .mount('#app')
