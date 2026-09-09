<template>
  <div class="el-tree-single-select">
    <div class="page-header">
      <h2>Element UI Tree 单选控制示例</h2>
      <p>展示如何控制el-tree组件的单选模式</p>
    </div>

    <div class="demo-section">
      <h3>1. 基础单选模式</h3>
      <div class="demo-item">
        <div class="controls">
          <button @click="setSelection('1')" class="btn btn-primary">选中节点1</button>
          <button @click="setSelection('1-1')" class="btn btn-primary">选中节点1-1</button>
          <button @click="setSelection('2')" class="btn btn-primary">选中节点2</button>
          <button @click="clearSelection" class="btn btn-secondary">清空选中</button>
        </div>
        
        <el-tree
          ref="singleTree"
          :data="treeData"
          :props="defaultProps"
          node-key="id"
          :highlight-current="true"
          @current-change="handleCurrentChange"
        />
        
        <div class="result">
          当前选中: {{ currentSelected }}
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>2. 使用数据绑定控制</h3>
      <div class="demo-item">
        <div class="controls">
          <button @click="setCurrentKey('1')" class="btn btn-primary">选中节点1</button>
          <button @click="setCurrentKey('1-1')" class="btn btn-primary">选中节点1-1</button>
          <button @click="setCurrentKey('2')" class="btn btn-primary">选中节点2</button>
          <button @click="setCurrentKey(null)" class="btn btn-secondary">清空选中</button>
        </div>
        
        <el-tree
          ref="bindTree"
          :data="treeData"
          :props="defaultProps"
          node-key="id"
          :highlight-current="true"
          :current-key="currentKey"
          @current-change="handleCurrentChange"
        />
        
        <div class="result">
          当前选中: {{ currentKey }}
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>3. 禁用某些节点</h3>
      <div class="demo-item">
        <div class="controls">
          <button @click="toggleDisable" class="btn btn-warning">
            {{ isDisabled ? '启用' : '禁用' }}节点1-1
          </button>
        </div>
        
        <el-tree
          ref="disableTree"
          :data="treeDataWithDisable"
          :props="defaultProps"
          node-key="id"
          :highlight-current="true"
          @current-change="handleCurrentChange"
        />
        
        <div class="result">
          当前选中: {{ currentSelected }}
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>4. 自定义节点样式</h3>
      <div class="demo-item">
        <el-tree
          ref="customTree"
          :data="treeData"
          :props="defaultProps"
          node-key="id"
          :highlight-current="true"
          @current-change="handleCurrentChange"
        >
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <span :class="{ 'selected-node': data.id === currentSelected }">
              {{ node.label }}
            </span>
            <span v-if="data.id === currentSelected" class="selected-icon">✓</span>
          </span>
        </el-tree>
        
        <div class="result">
          当前选中: {{ currentSelected }}
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>5. 代码示例</h3>
      <div class="code-example">
        <h4>单选控制方法：</h4>
        <pre><code>// 1. 设置选中节点
this.$refs.tree.setCurrentKey('nodeId')

// 2. 清空选中
this.$refs.tree.setCurrentKey(null)

// 3. 获取当前选中节点
const currentNode = this.$refs.tree.getCurrentNode()

// 4. 获取当前选中节点的key
const currentKey = this.$refs.tree.getCurrentKey()

// 5. 使用数据绑定
data() {
  return {
    currentKey: null
  }
}

// 6. 监听选中变化
handleCurrentChange(data, node) {
  console.log('选中节点:', data)
  console.log('节点对象:', node)
}</code></pre>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ElTreeSingleSelect',
  data() {
    return {
      // 树形数据
      treeData: [
        {
          id: '1',
          label: '一级 1',
          children: [
            {
              id: '1-1',
              label: '二级 1-1',
              children: [
                { id: '1-1-1', label: '三级 1-1-1' },
                { id: '1-1-2', label: '三级 1-1-2' }
              ]
            },
            {
              id: '1-2',
              label: '二级 1-2',
              children: [
                { id: '1-2-1', label: '三级 1-2-1' },
                { id: '1-2-2', label: '三级 1-2-2' }
              ]
            }
          ]
        },
        {
          id: '2',
          label: '一级 2',
          children: [
            {
              id: '2-1',
              label: '二级 2-1',
              children: [
                { id: '2-1-1', label: '三级 2-1-1' },
                { id: '2-1-2', label: '三级 2-1-2' }
              ]
            },
            {
              id: '2-2',
              label: '二级 2-2',
              children: [
                { id: '2-2-1', label: '三级 2-2-1' },
                { id: '2-2-2', label: '三级 2-2-2' }
              ]
            }
          ]
        }
      ],
      
      // 树组件配置
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      
      // 状态数据
      currentSelected: null,
      currentKey: null,
      isDisabled: false
    }
  },
  computed: {
    // 带禁用状态的树形数据
    treeDataWithDisable() {
      return this.treeData.map(node => this.addDisableProperty(node))
    }
  },
  methods: {
    // 1. 设置选中节点
    setSelection(nodeId) {
      this.$refs.singleTree.setCurrentKey(nodeId)
      this.currentSelected = nodeId
    },
    
    // 2. 清空选中
    clearSelection() {
      this.$refs.singleTree.setCurrentKey(null)
      this.currentSelected = null
    },
    
    // 3. 使用数据绑定设置选中
    setCurrentKey(key) {
      this.currentKey = key
    },
    
    // 4. 切换禁用状态
    toggleDisable() {
      this.isDisabled = !this.isDisabled
    },
    
    // 5. 添加禁用属性
    addDisableProperty(node) {
      const newNode = { ...node }
      if (node.id === '1-1') {
        newNode.disabled = this.isDisabled
      }
      if (node.children) {
        newNode.children = node.children.map(child => this.addDisableProperty(child))
      }
      return newNode
    },
    
    // 6. 获取当前选中节点
    getCurrentNode() {
      return this.$refs.singleTree.getCurrentNode()
    },
    
    // 7. 获取当前选中节点的key
    getCurrentKey() {
      return this.$refs.singleTree.getCurrentKey()
    },
    
    // 8. 事件处理
    handleCurrentChange(data, node) {
      this.currentSelected = data ? data.id : null
      console.log('选中节点:', data)
      console.log('节点对象:', node)
    }
  }
}
</script>

<style scoped>
.el-tree-single-select {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e8e8e8;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.demo-section {
  margin-bottom: 40px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  border-left: 4px solid #1890ff;
  padding-left: 12px;
}

.demo-item {
  margin-bottom: 20px;
}

.controls {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  min-width: 80px;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
  border-color: #1890ff;
}

.btn-primary:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.btn-secondary {
  background-color: white;
  color: #333;
  border-color: #d9d9d9;
}

.btn-secondary:hover {
  background-color: #f5f5f5;
  border-color: #40a9ff;
  color: #40a9ff;
}

.btn-warning {
  background-color: #faad14;
  color: white;
  border-color: #faad14;
}

.btn-warning:hover {
  background-color: #ffc53d;
  border-color: #ffc53d;
}

.result {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
  border-left: 3px solid #1890ff;
}

.code-example {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.code-example h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.code-example pre {
  margin: 0;
  padding: 12px;
  background-color: #fff;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
  color: #333;
}

/* 自定义节点样式 */
.custom-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.selected-node {
  color: #1890ff;
  font-weight: 600;
}

.selected-icon {
  color: #52c41a;
  font-weight: bold;
  margin-left: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-tree-single-select {
    padding: 16px;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>

