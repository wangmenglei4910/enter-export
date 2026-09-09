# 标签管理弹窗组件

这是一个Vue组件，用于管理标签的层级关系。组件支持新增和编辑模式，可以动态添加标签行，并通过API获取标签分类和标签名称数据。

## 功能特性

- ✅ 支持新增和编辑模式
- ✅ 动态添加/删除标签行
- ✅ 标签分类和标签名称的级联选择
- ✅ API数据集成
- ✅ 数据验证
- ✅ 响应式设计
- ✅ 模拟数据支持

## 文件结构

```
src/components/
├── TagManagementModal.vue      # 主弹窗组件
├── TagManagementExample.vue    # 使用示例
└── README.md                   # 说明文档

src/mock/
└── tagApi.js                   # API模拟数据
```

## 组件使用

### 基本用法

```vue
<template>
  <div>
    <button @click="showModal = true">打开标签管理</button>
    
    <TagManagementModal
      :visible="showModal"
      :isEdit="false"
      :editData="[]"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script>
import TagManagementModal from './components/TagManagementModal.vue'

export default {
  components: {
    TagManagementModal
  },
  data() {
    return {
      showModal: false
    }
  },
  methods: {
    handleConfirm(data) {
      console.log('确认的数据:', data)
      this.showModal = false
    },
    handleCancel() {
      this.showModal = false
    }
  }
}
</script>
```

### Props 属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| visible | Boolean | false | 控制弹窗显示/隐藏 |
| isEdit | Boolean | false | 是否为编辑模式 |
| editData | Array | [] | 编辑时的初始数据 |

### Events 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| confirm | data | 确认时触发，返回标签数据数组 |
| cancel | - | 取消时触发 |

### 数据结构

#### 输入数据格式 (editData)
```javascript
[
  {
    categoryId: '1',  // 标签分类ID
    tagId: '1'        // 标签ID
  },
  {
    categoryId: '2',
    tagId: '3'
  }
]
```

#### 输出数据格式 (confirm事件)
```javascript
[
  {
    id: 1,            // 行ID（组件内部生成）
    categoryId: '1',  // 标签分类ID
    tagId: '1'        // 标签ID
  },
  {
    id: 2,
    categoryId: '2',
    tagId: '3'
  }
]
```

## API 接口

组件需要以下API接口支持：

### 1. 获取标签分类列表
```javascript
GET /api/tag-categories
Response: {
  code: 200,
  message: 'success',
  data: [
    { id: '1', name: '产品线' },
    { id: '2', name: '产品大类' },
    // ...
  ]
}
```

### 2. 根据分类获取标签列表
```javascript
GET /api/tags?categoryId={categoryId}
Response: {
  code: 200,
  message: 'success',
  data: [
    { id: '1', name: '代销债券' },
    { id: '2', name: '自营债券' },
    // ...
  ]
}
```

## 模拟数据

项目包含了完整的模拟数据，位于 `src/mock/tagApi.js`，包含：

- 8个标签分类（产品线、产品大类等）
- 每个分类下的多个标签选项
- 模拟API调用函数

### 使用模拟数据

```javascript
import { mockApi } from '../mock/tagApi.js'

// 获取标签分类
const categories = await mockApi.getTagCategories()

// 获取指定分类的标签
const tags = await mockApi.getTagsByCategory('1')
```

## 样式定制

组件使用scoped样式，可以通过以下CSS变量进行定制：

```css
/* 主要颜色 */
--primary-color: #1890ff;
--success-color: #52c41a;
--danger-color: #ff4d4f;

/* 边框和背景 */
--border-color: #d9d9d9;
--background-color: #fafafa;
--hover-background: #f5f5f5;
```

## 响应式支持

组件支持移动端适配：

- 弹窗宽度在小屏幕上自适应
- 表格内容在小屏幕上优化显示
- 按钮布局在移动端垂直排列

## 注意事项

1. **API集成**: 需要根据实际项目替换模拟API为真实API
2. **消息提示**: 组件使用 `this.$message` 进行消息提示，需要确保项目中已配置
3. **HTTP客户端**: 组件使用 `this.$http` 进行API调用，需要确保项目中已配置
4. **数据验证**: 组件会验证每行数据的完整性，确保分类和标签都已选择

## 示例页面

运行 `TagManagementExample.vue` 可以查看完整的使用示例，包括：

- 新增标签功能
- 编辑标签功能
- 数据保存和显示

## 开发说明

### 本地开发

1. 将组件文件复制到项目中
2. 安装必要的依赖
3. 配置API接口
4. 在页面中引入并使用组件

### 自定义扩展

- 可以扩展更多验证规则
- 可以添加更多操作按钮
- 可以自定义表格列
- 可以添加搜索和筛选功能
