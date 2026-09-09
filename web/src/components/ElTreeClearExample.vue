<template>
  <div class="el-tree-clear-example">
    <div class="page-header">
      <h2>Element UI Tree 清空选中内容示例</h2>
      <p>展示如何清空el-tree组件的选中状态</p>
    </div>

    <div class="demo-section">
      <h3>1. 单选模式清空</h3>
      <div class="demo-item">
        <div class="controls">
          <button @click="clearSingleSelection" class="btn btn-primary">
            清空单选
          </button>
          <button @click="setSingleSelection" class="btn btn-secondary">
            设置选中
          </button>
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
      <h3>2. 多选模式清空</h3>
      <div class="demo-item">
        <div class="controls">
          <button @click="clearMultipleSelection" class="btn btn-primary">
            清空多选
          </button>
          <button @click="setMultipleSelection" class="btn btn-secondary">
            设置多选
          </button>
        </div>
        
        <el-tree
          ref="multipleTree"
          :data="treeData"
          :props="defaultProps"
          node-key="id"
          show-checkbox
          @check="handleCheck"
        />
        
        <div class="result">
          选中节点: {{ checkedNodes }}
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>3. 展开/收起控制</h3>
      <div class="demo-item">
        <div class="controls">
          <button @click="expandAll" class="btn btn-primary">
            展开所有
          </button>
          <button @click="collapseAll" class="btn btn-secondary">
            收起所有
          </button>
          <button @click="clearExpanded" class="btn btn-warning">
            清空展开状态
          </button>
        </div>
        
        <el-tree
          ref="expandTree"
          :data="treeData"
          :props="defaultProps"
          node-key="id"
          :default-expanded-keys="expandedKeys"
          @node-expand="handleNodeExpand"
          @node-collapse="handleNodeCollapse"
        />
        
        <div class="result">
          展开的节点: {{ expandedKeys }}
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>4. 综合操作</h3>
      <div class="demo-item">
        <div class="controls">
          <button @click="resetAll" class="btn btn-danger">
            重置所有状态
          </button>
          <button @click="setDefaultState" class="btn btn-success">
            设置默认状态
          </button>
        </div>
        
        <el-tree
          ref="comprehensiveTree"
          :data="treeData"
          :props="defaultProps"
          node-key="id"
          show-checkbox
          :highlight-current="true"
          :default-expanded-keys="defaultExpandedKeys"
          :default-checked-keys="defaultCheckedKeys"
          @current-change="handleCurrentChange"
          @check="handleCheck"
          @node-expand="handleNodeExpand"
          @node-collapse="handleNodeCollapse"
        />
        
        <div class="result">
          <div>当前选中: {{ currentSelected }}</div>
          <div>选中节点: {{ checkedNodes }}</div>
          <div>展开节点: {{ expandedKeys }}</div>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>5. 代码示例</h3>
      <div class="code-example">
        <h4>清空选中的方法：</h4>
        <pre><code>// 1. 清空单选
this.$refs.tree.setCurrentKey(null)

// 2. 清空多选
this.$refs.tree.setCheckedKeys([])

// 3. 清空展开状态
this.$refs.tree.setExpandedKeys([])

// 4. 重置所有状态
this.$refs.tree.setCurrentKey(null)
this.$refs.tree.setCheckedKeys([])
this.$refs.tree.setExpandedKeys([])

// 5. 设置默认状态
this.$refs.tree.setCurrentKey('1')
this.$refs.tree.setCheckedKeys(['1', '1-1'])
this.$refs.tree.setExpandedKeys(['1', '1-1'])</code></pre>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ElTreeClearExample',
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
      checkedNodes: [],
      expandedKeys: [],
      defaultExpandedKeys: ['1'],
      defaultCheckedKeys: ['1-1']
    }
  },
  methods: {
    // 1. 清空单选
    clearSingleSelection() {
      this.$refs.singleTree.setCurrentKey(null)
      this.currentSelected = null
    },
    
    // 设置单选
    setSingleSelection() {
      this.$refs.singleTree.setCurrentKey('1-1')
      this.currentSelected = '1-1'
    },
    
    // 2. 清空多选
    clearMultipleSelection() {
      this.$refs.multipleTree.setCheckedKeys([])
      this.checkedNodes = []
    },
    
    // 设置多选
    setMultipleSelection() {
      const keys = ['1-1', '1-2', '2-1']
      this.$refs.multipleTree.setCheckedKeys(keys)
      this.checkedNodes = keys
    },
    
    // 3. 展开所有
    expandAll() {
      const allKeys = this.getAllNodeKeys(this.treeData)
      this.$refs.expandTree.setExpandedKeys(allKeys)
      this.expandedKeys = allKeys
    },
    
    // 收起所有
    collapseAll() {
      this.$refs.expandTree.setExpandedKeys([])
      this.expandedKeys = []
    },
    
    // 清空展开状态
    clearExpanded() {
      this.$refs.expandTree.setExpandedKeys([])
      this.expandedKeys = []
    },
    
    // 4. 重置所有状态
    resetAll() {
      this.$refs.comprehensiveTree.setCurrentKey(null)
      this.$refs.comprehensiveTree.setCheckedKeys([])
      this.$refs.comprehensiveTree.setExpandedKeys([])
      this.currentSelected = null
      this.checkedNodes = []
      this.expandedKeys = []
    },
    
    // 设置默认状态
    setDefaultState() {
      this.$refs.comprehensiveTree.setCurrentKey('1')
      this.$refs.comprehensiveTree.setCheckedKeys(['1-1', '1-2'])
      this.$refs.comprehensiveTree.setExpandedKeys(['1', '1-1'])
      this.currentSelected = '1'
      this.checkedNodes = ['1-1', '1-2']
      this.expandedKeys = ['1', '1-1']
    },
    
    // 获取所有节点key
    getAllNodeKeys(nodes) {
      let keys = []
      nodes.forEach(node => {
        keys.push(node.id)
        if (node.children) {
          keys = keys.concat(this.getAllNodeKeys(node.children))
        }
      })
      return keys
    },
    
    // 事件处理
    handleCurrentChange(data, node) {
      this.currentSelected = data ? data.id : null
      console.log('当前选中:', data)
    },
    
    handleCheck(data, checkedInfo) {
      this.checkedNodes = checkedInfo.checkedKeys
      console.log('选中节点:', checkedInfo.checkedKeys)
    },
    
    handleNodeExpand(data, node) {
      if (!this.expandedKeys.includes(data.id)) {
        this.expandedKeys.push(data.id)
      }
      console.log('节点展开:', data.id)
    },
    
    handleNodeCollapse(data, node) {
      const index = this.expandedKeys.indexOf(data.id)
      if (index > -1) {
        this.expandedKeys.splice(index, 1)
      }
      console.log('节点收起:', data.id)
    }
  }
}
</script>

<style scoped>
.el-tree-clear-example {
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

.btn-danger {
  background-color: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}

.btn-danger:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

.btn-success {
  background-color: #52c41a;
  color: white;
  border-color: #52c41a;
}

.btn-success:hover {
  background-color: #73d13d;
  border-color: #73d13d;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .el-tree-clear-example {
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

