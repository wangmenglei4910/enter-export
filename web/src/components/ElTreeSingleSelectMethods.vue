<template>
  <div class="el-tree-single-select-methods">
    <h3>Element UI Tree 单选控制方法汇总</h3>
    
    <div class="method-section">
      <h4>1. 基础单选配置</h4>
      <div class="code-block">
        <pre><code>&lt;el-tree
  :data="treeData"
  :props="defaultProps"
  node-key="id"
  :highlight-current="true"
  @current-change="handleCurrentChange"
/&gt;</code></pre>
      </div>
      <div class="explanation">
        <p><strong>关键属性：</strong></p>
        <ul>
          <li><code>node-key="id"</code> - 指定节点的唯一标识字段</li>
          <li><code>:highlight-current="true"</code> - 高亮当前选中节点</li>
          <li><code>@current-change</code> - 监听选中状态变化</li>
        </ul>
      </div>
    </div>

    <div class="method-section">
      <h4>2. 程序控制选中</h4>
      <div class="code-block">
        <pre><code>// 设置选中节点
this.$refs.tree.setCurrentKey('nodeId')

// 清空选中
this.$refs.tree.setCurrentKey(null)

// 获取当前选中节点
const currentNode = this.$refs.tree.getCurrentNode()

// 获取当前选中节点的key
const currentKey = this.$refs.tree.getCurrentKey()</code></pre>
      </div>
    </div>

    <div class="method-section">
      <h4>3. 数据绑定控制</h4>
      <div class="code-block">
        <pre><code>&lt;el-tree
  :data="treeData"
  :props="defaultProps"
  node-key="id"
  :highlight-current="true"
  :current-key="currentKey"
  @current-change="handleCurrentChange"
/&gt;

// 在data中定义
data() {
  return {
    currentKey: null
  }
}

// 控制选中
methods: {
  setCurrentKey(key) {
    this.currentKey = key
  }
}</code></pre>
      </div>
    </div>

    <div class="method-section">
      <h4>4. 事件处理</h4>
      <div class="code-block">
        <pre><code>// 监听选中变化
handleCurrentChange(data, node) {
  console.log('选中节点数据:', data)
  console.log('节点对象:', node)
  console.log('节点key:', data ? data.id : null)
  
  // 更新状态
  this.currentSelected = data ? data.id : null
}</code></pre>
      </div>
    </div>

    <div class="method-section">
      <h4>5. 禁用节点</h4>
      <div class="code-block">
        <pre><code>// 在数据中添加disabled属性
treeData: [
  {
    id: '1',
    label: '节点1',
    disabled: true  // 禁用此节点
  },
  {
    id: '2',
    label: '节点2',
    children: [
      {
        id: '2-1',
        label: '子节点2-1',
        disabled: false  // 启用此节点
      }
    ]
  }
]</code></pre>
      </div>
    </div>

    <div class="method-section">
      <h4>6. 自定义节点样式</h4>
      <div class="code-block">
        <pre><code>&lt;el-tree
  :data="treeData"
  :props="defaultProps"
  node-key="id"
  :highlight-current="true"
&gt;
  &lt;span class="custom-tree-node" slot-scope="{ node, data }"&gt;
    &lt;span :class="{ 'selected-node': data.id === currentSelected }"&gt;
      {{ node.label }}
    &lt;/span&gt;
    &lt;span v-if="data.id === currentSelected" class="selected-icon"&gt;✓&lt;/span&gt;
  &lt;/span&gt;
&lt;/el-tree&gt;</code></pre>
      </div>
    </div>

    <div class="method-section">
      <h4>7. 完整示例</h4>
      <div class="code-block">
        <pre><code>&lt;template&gt;
  &lt;div&gt;
    &lt;el-button @click="selectNode('1')"&gt;选中节点1&lt;/el-button&gt;
    &lt;el-button @click="selectNode('2')"&gt;选中节点2&lt;/el-button&gt;
    &lt;el-button @click="clearSelection"&gt;清空选中&lt;/el-button&gt;
    
    &lt;el-tree
      ref="tree"
      :data="treeData"
      :props="defaultProps"
      node-key="id"
      :highlight-current="true"
      :current-key="currentKey"
      @current-change="handleCurrentChange"
    /&gt;
    
    &lt;p&gt;当前选中: {{ currentKey }}&lt;/p&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script&gt;
export default {
  data() {
    return {
      treeData: [
        { id: '1', label: '节点1' },
        { id: '2', label: '节点2' }
      ],
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      currentKey: null
    }
  },
  methods: {
    selectNode(key) {
      this.currentKey = key
    },
    clearSelection() {
      this.currentKey = null
    },
    handleCurrentChange(data, node) {
      this.currentKey = data ? data.id : null
    }
  }
}
&lt;/script&gt;</code></pre>
      </div>
    </div>

    <div class="method-section">
      <h4>8. 常用方法总结</h4>
      <div class="summary">
        <table>
          <thead>
            <tr>
              <th>方法</th>
              <th>说明</th>
              <th>示例</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>setCurrentKey(key)</code></td>
              <td>设置当前选中节点</td>
              <td><code>this.$refs.tree.setCurrentKey('1')</code></td>
            </tr>
            <tr>
              <td><code>getCurrentNode()</code></td>
              <td>获取当前选中节点数据</td>
              <td><code>const node = this.$refs.tree.getCurrentNode()</code></td>
            </tr>
            <tr>
              <td><code>getCurrentKey()</code></td>
              <td>获取当前选中节点的key</td>
              <td><code>const key = this.$refs.tree.getCurrentKey()</code></td>
            </tr>
            <tr>
              <td><code>@current-change</code></td>
              <td>监听选中状态变化</td>
              <td><code>@current-change="handleChange"</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ElTreeSingleSelectMethods'
}
</script>

<style scoped>
.el-tree-single-select-methods {
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

.explanation {
  margin-top: 12px;
  padding: 12px;
  background-color: #e6f7ff;
  border-radius: 4px;
  border-left: 4px solid #1890ff;
}

.explanation p {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #333;
}

.explanation ul {
  margin: 0;
  padding-left: 20px;
}

.explanation li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.explanation code {
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 12px;
}

.summary {
  overflow-x: auto;
}

.summary table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.summary th,
.summary td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.summary th {
  background-color: #fafafa;
  font-weight: 600;
  color: #333;
}

.summary code {
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-tree-single-select-methods {
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
  
  .summary table {
    font-size: 12px;
  }
  
  .summary th,
  .summary td {
    padding: 8px;
  }
}
</style>

