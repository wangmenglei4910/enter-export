<template>
  <div class="tree-select-example">
    <div class="page-header">
      <h2>树形选择器示例</h2>
      <p>支持树状结构的select框，可以选择任意节点，父子节点不联动</p>
    </div>

    <div class="demo-section">
      <h3>基础用法</h3>
      <div class="demo-item">
        <label>选择标签分类：</label>
        <TreeSelect
          v-model="selectedValue1"
          :tree-data="treeData"
          placeholder="请选择标签分类"
          @change="handleChange1"
        />
        <div class="result">
          选中值: {{ selectedValue1 }}
          <span v-if="selectedNode1"> - {{ selectedNode1.label }}</span>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>禁用状态</h3>
      <div class="demo-item">
        <label>禁用选择器：</label>
        <TreeSelect
          v-model="selectedValue2"
          :tree-data="treeData"
          placeholder="禁用状态"
          :disabled="true"
        />
      </div>
    </div>

    <div class="demo-section">
      <h3>不可搜索</h3>
      <div class="demo-item">
        <label>不可搜索：</label>
        <TreeSelect
          v-model="selectedValue3"
          :tree-data="treeData"
          placeholder="不可搜索"
          :searchable="false"
          @change="handleChange3"
        />
        <div class="result">
          选中值: {{ selectedValue3 }}
          <span v-if="selectedNode3"> - {{ selectedNode3.label }}</span>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>自定义宽度</h3>
      <div class="demo-item">
        <label>自定义宽度：</label>
        <TreeSelect
          v-model="selectedValue4"
          :tree-data="treeData"
          placeholder="自定义宽度"
          dropdown-width="300px"
          @change="handleChange4"
        />
        <div class="result">
          选中值: {{ selectedValue4 }}
          <span v-if="selectedNode4"> - {{ selectedNode4.label }}</span>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>多选示例（扩展）</h3>
      <div class="demo-item">
        <label>多选模式：</label>
        <TreeSelect
          v-model="selectedValue5"
          :tree-data="treeData"
          placeholder="多选模式"
          :multiple="true"
          @change="handleChange5"
        />
        <div class="result">
          选中值: {{ selectedValue5 }}
          <div v-if="selectedNodes5.length > 0">
            选中节点:
            <ul>
              <li v-for="node in selectedNodes5" :key="node.id">
                {{ node.label }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>数据展示</h3>
      <div class="data-display">
        <h4>树形数据结构：</h4>
        <pre>{{ JSON.stringify(treeData, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import TreeSelect from './TreeSelect.vue'

export default {
  name: 'TreeSelectExample',
  components: {
    TreeSelect
  },
  data() {
    return {
      // 选中的值
      selectedValue1: null,
      selectedValue2: '1',
      selectedValue3: null,
      selectedValue4: null,
      selectedValue5: [],
      
      // 选中的节点对象
      selectedNode1: null,
      selectedNode3: null,
      selectedNode4: null,
      selectedNodes5: [],
      
      // 树形数据
      treeData: [
        {
          id: '1',
          label: '标签分类测试',
          children: [
            {
              id: '1-1',
              label: '标签分类-子分类',
              children: [
                {
                  id: '1-1-1',
                  label: '标签分类2'
                },
                {
                  id: '1-1-2',
                  label: '标签分类3'
                },
                {
                  id: '1-1-3',
                  label: '标签分类4'
                }
              ]
            },
            {
              id: '1-2',
              label: '标签分类5',
              children: [
                {
                  id: '1-2-1',
                  label: '标签分类6'
                },
                {
                  id: '1-2-2',
                  label: '标签分类7'
                }
              ]
            }
          ]
        },
        {
          id: '2',
          label: '标签分类测试0818-001',
          children: [
            {
              id: '2-1',
              label: '标签分类8'
            },
            {
              id: '2-2',
              label: '标签分类9'
            }
          ]
        },
        {
          id: '3',
          label: '产品线',
          children: [
            {
              id: '3-1',
              label: '代销债券'
            },
            {
              id: '3-2',
              label: '自营债券'
            },
            {
              id: '3-3',
              label: '理财产品'
            }
          ]
        },
        {
          id: '4',
          label: '风险等级',
          children: [
            {
              id: '4-1',
              label: '低风险'
            },
            {
              id: '4-2',
              label: '中低风险'
            },
            {
              id: '4-3',
              label: '中等风险'
            },
            {
              id: '4-4',
              label: '中高风险'
            },
            {
              id: '4-5',
              label: '高风险'
            }
          ]
        }
      ]
    }
  },
  methods: {
    handleChange1(node) {
      this.selectedNode1 = node
      console.log('选择1:', node)
    },
    
    handleChange3(node) {
      this.selectedNode3 = node
      console.log('选择3:', node)
    },
    
    handleChange4(node) {
      this.selectedNode4 = node
      console.log('选择4:', node)
    },
    
    handleChange5(nodes) {
      this.selectedNodes5 = nodes
      console.log('多选5:', nodes)
    }
  }
}
</script>

<style scoped>
.tree-select-example {
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

.demo-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.demo-item .tree-select {
  width: 300px;
  margin-bottom: 10px;
}

.result {
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
  border-left: 3px solid #1890ff;
}

.result ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.result li {
  margin-bottom: 4px;
}

.data-display {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.data-display h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.data-display pre {
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
  .tree-select-example {
    padding: 16px;
  }
  
  .demo-item .tree-select {
    width: 100%;
  }
  
  .demo-section {
    padding: 16px;
  }
}
</style>

