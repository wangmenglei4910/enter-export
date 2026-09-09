<template>
  <div class="el-tree-clear-methods">
    <h3>Element UI Tree 清空方法汇总</h3>
    
    <div class="method-section">
      <h4>1. 清空单选状态</h4>
      <div class="code-block">
        <pre><code>// 方法1：使用 setCurrentKey(null)
this.$refs.tree.setCurrentKey(null)

// 方法2：使用 setCurrentKey('')
this.$refs.tree.setCurrentKey('')

// 方法3：通过数据绑定清空
this.currentKey = null</code></pre>
      </div>
    </div>

    <div class="method-section">
      <h4>2. 清空多选状态</h4>
      <div class="code-block">
        <pre><code>// 方法1：使用 setCheckedKeys([])
this.$refs.tree.setCheckedKeys([])

// 方法2：使用 setCheckedKeys(null)
this.$refs.tree.setCheckedKeys(null)

// 方法3：通过数据绑定清空
this.checkedKeys = []</code></pre>
      </div>
    </div>

    <div class="method-section">
      <h4>3. 清空展开状态</h4>
      <div class="code-block">
        <pre><code>// 方法1：使用 setExpandedKeys([])
this.$refs.tree.setExpandedKeys([])

// 方法2：使用 setExpandedKeys(null)
this.$refs.tree.setExpandedKeys(null)

// 方法3：通过数据绑定清空
this.expandedKeys = []</code></pre>
      </div>
    </div>

    <div class="method-section">
      <h4>4. 综合清空方法</h4>
      <div class="code-block">
        <pre><code>// 清空所有状态
clearAllTreeState() {
  // 清空单选
  this.$refs.tree.setCurrentKey(null)
  
  // 清空多选
  this.$refs.tree.setCheckedKeys([])
  
  // 清空展开状态
  this.$refs.tree.setExpandedKeys([])
  
  // 清空数据绑定
  this.currentKey = null
  this.checkedKeys = []
  this.expandedKeys = []
}</code></pre>
      </div>
    </div>

    <div class="method-section">
      <h4>5. 实际使用示例</h4>
      <div class="code-block">
        <pre><code>&lt;template&gt;
  &lt;div&gt;
    &lt;el-button @click="clearSelection"&gt;清空选中&lt;/el-button&gt;
    &lt;el-tree
      ref="tree"
      :data="treeData"
      :props="defaultProps"
      node-key="id"
      show-checkbox
      :highlight-current="true"
      :current-key="currentKey"
      :checked-keys="checkedKeys"
      :expanded-keys="expandedKeys"
    /&gt;
  &lt;div&gt;
&lt;/template&gt;

&lt;script&gt;
export default {
  data() {
    return {
      treeData: [...],
      currentKey: null,
      checkedKeys: [],
      expandedKeys: []
    }
  },
  methods: {
    clearSelection() {
      // 清空所有选中状态
      this.$refs.tree.setCurrentKey(null)
      this.$refs.tree.setCheckedKeys([])
      this.$refs.tree.setExpandedKeys([])
      
      // 更新数据绑定
      this.currentKey = null
      this.checkedKeys = []
      this.expandedKeys = []
    }
  }
}
&lt;/script&gt;</code></pre>
      </div>
    </div>

    <div class="method-section">
      <h4>6. 注意事项</h4>
      <div class="notes">
        <ul>
          <li><strong>setCurrentKey(null)</strong> - 清空单选状态，推荐使用</li>
          <li><strong>setCheckedKeys([])</strong> - 清空多选状态，推荐使用</li>
          <li><strong>setExpandedKeys([])</strong> - 清空展开状态，推荐使用</li>
          <li>如果使用了数据绑定（:current-key, :checked-keys等），需要同时清空对应的数据</li>
          <li>清空操作是异步的，如果需要立即获取状态，建议使用数据绑定方式</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ElTreeClearMethods'
}
</script>

<style scoped>
.el-tree-clear-methods {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

h3 {
  color: #333;
  font-size: 24px;
  margin-bottom: 30px;
  border-bottom: 2px solid #1890ff;
  padding-bottom: 10px;
}

.method-section {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.method-section h4 {
  color: #333;
  font-size: 18px;
  margin: 0 0 16px 0;
  border-left: 4px solid #1890ff;
  padding-left: 12px;
}

.code-block {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  padding: 0;
  background: none;
  border: none;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.code-block code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.notes {
  background-color: #fff7e6;
  padding: 16px;
  border-radius: 4px;
  border-left: 4px solid #faad14;
}

.notes ul {
  margin: 0;
  padding-left: 20px;
}

.notes li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.notes strong {
  color: #1890ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-tree-clear-methods {
    padding: 16px;
  }
  
  .method-section {
    padding: 16px;
  }
  
  .code-block {
    padding: 12px;
  }
  
  .code-block pre {
    font-size: 12px;
  }
}
</style>

