<template>
  <div class="tree-select" :class="{ 'is-disabled': disabled }">
    <!-- 输入框显示区域 -->
    <div 
      class="tree-select-input" 
      @click="toggleDropdown"
      :class="{ 'is-focus': showDropdown, 'is-disabled': disabled }"
    >
      <div class="selected-text">
        <span v-if="selectedNode">{{ selectedNode.label }}</span>
        <span v-else class="placeholder">{{ placeholder }}</span>
      </div>
      <div class="arrow-icon" :class="{ 'is-reverse': showDropdown }">
        <svg viewBox="0 0 1024 1024" width="12" height="12">
          <path d="M512 384l-256 256 64 64 192-192 192 192 64-64z" fill="currentColor"/>
        </svg>
      </div>
    </div>

    <!-- 下拉树形菜单 -->
    <div 
      v-show="showDropdown" 
      class="tree-select-dropdown"
      :style="{ width: dropdownWidth }"
    >
      <!-- 搜索框 -->
      <div v-if="searchable" class="search-box">
        <input 
          v-model="searchText" 
          type="text" 
          placeholder="搜索节点..."
          class="search-input"
          @click.stop
        />
      </div>

      <!-- 树形结构 -->
      <div class="tree-container" @click.stop>
        <div v-if="filteredTreeData.length === 0" class="empty-text">
          暂无数据
        </div>
        <tree-node
          v-for="node in filteredTreeData"
          :key="node.id"
          :node="node"
          :level="0"
          :selected-id="selectedId"
          :search-text="searchText"
          @select="handleNodeSelect"
          @toggle="handleNodeToggle"
        />
      </div>
    </div>

    <!-- 遮罩层 -->
    <div 
      v-show="showDropdown" 
      class="tree-select-mask" 
      @click="closeDropdown"
    ></div>
  </div>
</template>

<script>
// 树节点组件
const TreeNode = {
  name: 'TreeNode',
  props: {
    node: {
      type: Object,
      required: true
    },
    level: {
      type: Number,
      default: 0
    },
    selectedId: {
      type: [String, Number],
      default: null
    },
    searchText: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isExpanded: false
    }
  },
  computed: {
    hasChildren() {
      return this.node.children && this.node.children.length > 0
    },
    isSelected() {
      return this.selectedId === this.node.id
    },
    indentStyle() {
      return {
        paddingLeft: `${this.level * 20 + 8}px`
      }
    },
    filteredChildren() {
      if (!this.searchText || !this.hasChildren) {
        return this.node.children || []
      }
      return this.node.children.filter(child => 
        this.matchSearch(child, this.searchText)
      )
    }
  },
  methods: {
    matchSearch(node, searchText) {
      if (node.label.toLowerCase().includes(searchText.toLowerCase())) {
        return true
      }
      if (node.children) {
        return node.children.some(child => this.matchSearch(child, searchText))
      }
      return false
    },
    handleSelect() {
      this.$emit('select', this.node)
    },
    handleToggle() {
      this.isExpanded = !this.isExpanded
      this.$emit('toggle', this.node, this.isExpanded)
    }
  },
  template: `
    <div class="tree-node">
      <div 
        class="tree-node-content" 
        :style="indentStyle"
        :class="{ 'is-selected': isSelected }"
        @click="handleSelect"
      >
        <span 
          v-if="hasChildren" 
          class="expand-icon" 
          :class="{ 'is-expanded': isExpanded }"
          @click.stop="handleToggle"
        >
          <svg viewBox="0 0 1024 1024" width="12" height="12">
            <path d="M384 384l256 256 64-64-192-192-192 192z" fill="currentColor"/>
          </svg>
        </span>
        <span v-else class="expand-placeholder"></span>
        
        <span class="node-label">{{ node.label }}</span>
      </div>
      
      <div v-if="hasChildren && isExpanded" class="tree-children">
        <tree-node
          v-for="child in filteredChildren"
          :key="child.id"
          :node="child"
          :level="level + 1"
          :selected-id="selectedId"
          :search-text="searchText"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle', $event, $event)"
        />
      </div>
    </div>
  `
}

export default {
  name: 'TreeSelect',
  components: {
    TreeNode
  },
  props: {
    // 树形数据
    treeData: {
      type: Array,
      default: () => []
    },
    // 当前选中的值
    value: {
      type: [String, Number],
      default: null
    },
    // 占位符
    placeholder: {
      type: String,
      default: '请选择'
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 是否可搜索
    searchable: {
      type: Boolean,
      default: true
    },
    // 下拉框宽度
    dropdownWidth: {
      type: String,
      default: '100%'
    }
  },
  data() {
    return {
      showDropdown: false,
      selectedNode: null,
      selectedId: null,
      searchText: ''
    }
  },
  computed: {
    filteredTreeData() {
      if (!this.searchText) {
        return this.treeData
      }
      return this.treeData.filter(node => this.matchSearch(node, this.searchText))
    }
  },
  watch: {
    value: {
      handler(newVal) {
        this.selectedId = newVal
        this.findSelectedNode()
      },
      immediate: true
    },
    treeData: {
      handler() {
        this.findSelectedNode()
      },
      deep: true
    }
  },
  mounted() {
    this.findSelectedNode()
    // 点击外部关闭下拉框
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    // 查找选中的节点
    findSelectedNode() {
      if (!this.selectedId) {
        this.selectedNode = null
        return
      }
      this.selectedNode = this.findNodeById(this.treeData, this.selectedId)
    },
    
    // 根据ID查找节点
    findNodeById(nodes, id) {
      for (let node of nodes) {
        if (node.id === id) {
          return node
        }
        if (node.children) {
          const found = this.findNodeById(node.children, id)
          if (found) return found
        }
      }
      return null
    },
    
    // 搜索匹配
    matchSearch(node, searchText) {
      if (node.label.toLowerCase().includes(searchText.toLowerCase())) {
        return true
      }
      if (node.children) {
        return node.children.some(child => this.matchSearch(child, searchText))
      }
      return false
    },
    
    // 切换下拉框显示
    toggleDropdown() {
      if (this.disabled) return
      this.showDropdown = !this.showDropdown
      if (this.showDropdown) {
        this.searchText = ''
      }
    },
    
    // 关闭下拉框
    closeDropdown() {
      this.showDropdown = false
      this.searchText = ''
    },
    
    // 处理节点选择
    handleNodeSelect(node) {
      this.selectedNode = node
      this.selectedId = node.id
      this.$emit('input', node.id)
      this.$emit('change', node)
      this.closeDropdown()
    },
    
    // 处理节点展开/收起
    handleNodeToggle(node, isExpanded) {
      // 这里可以添加展开/收起的逻辑
      console.log('Node toggle:', node.label, isExpanded)
    },
    
    // 点击外部关闭
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.closeDropdown()
      }
    }
  }
}
</script>

<style scoped>
.tree-select {
  position: relative;
  display: inline-block;
  width: 100%;
}

.tree-select-input {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 32px;
}

.tree-select-input:hover {
  border-color: #40a9ff;
}

.tree-select-input.is-focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.tree-select-input.is-disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: #999;
}

.selected-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.placeholder {
  color: #999;
}

.arrow-icon {
  margin-left: 8px;
  color: #999;
  transition: transform 0.3s;
}

.arrow-icon.is-reverse {
  transform: rotate(180deg);
}

.tree-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow: hidden;
}

.search-box {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.tree-container {
  max-height: 250px;
  overflow-y: auto;
  padding: 4px 0;
}

.empty-text {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.tree-node {
  user-select: none;
}

.tree-node-content {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.tree-node-content:hover {
  background-color: #f5f5f5;
}

.tree-node-content.is-selected {
  background-color: #e6f7ff;
  color: #1890ff;
}

.expand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.expand-icon.is-expanded {
  transform: rotate(90deg);
}

.expand-placeholder {
  width: 16px;
  margin-right: 4px;
}

.node-label {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.tree-children {
  /* 子节点容器 */
}

.tree-select-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

/* 滚动条样式 */
.tree-container::-webkit-scrollbar {
  width: 6px;
}

.tree-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.tree-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.tree-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tree-select-dropdown {
    max-height: 250px;
  }
  
  .tree-container {
    max-height: 200px;
  }
}
</style>

