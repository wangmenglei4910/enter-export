<template>
  <div class="simple-tree-select" :class="{ 'is-disabled': disabled }">
    <!-- 输入框 -->
    <div 
      class="select-input" 
      @click="toggleDropdown"
      :class="{ 'is-focus': showDropdown, 'is-disabled': disabled }"
    >
      <span class="selected-text">
        <span v-if="selectedNode">{{ selectedNode.label }}</span>
        <span v-else class="placeholder">{{ placeholder }}</span>
      </span>
      <span class="arrow" :class="{ 'is-reverse': showDropdown }">▼</span>
    </div>

    <!-- 下拉选项 -->
    <div v-show="showDropdown" class="select-options">
      <div v-if="searchable" class="search-box">
        <input 
          v-model="searchText" 
          type="text" 
          placeholder="搜索..."
          @click.stop
        />
      </div>
      
      <div class="options-list" @click.stop>
        <div v-if="filteredOptions.length === 0" class="empty">
          暂无数据
        </div>
        <div
          v-for="option in filteredOptions"
          :key="option.id"
          class="option-item"
          :class="{ 'is-selected': option.id === selectedId }"
          :style="{ paddingLeft: (option.level * 20 + 12) + 'px' }"
          @click="selectOption(option)"
        >
          <span class="option-text">{{ option.label }}</span>
        </div>
      </div>
    </div>

    <!-- 遮罩 -->
    <div v-show="showDropdown" class="select-mask" @click="closeDropdown"></div>
  </div>
</template>

<script>
export default {
  name: 'SimpleTreeSelect',
  props: {
    // 树形数据
    options: {
      type: Array,
      default: () => []
    },
    // 当前值
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
    }
  },
  data() {
    return {
      showDropdown: false,
      selectedNode: null,
      selectedId: null,
      searchText: '',
      flatOptions: []
    }
  },
  computed: {
    filteredOptions() {
      if (!this.searchText) {
        return this.flatOptions
      }
      return this.flatOptions.filter(option => 
        option.label.toLowerCase().includes(this.searchText.toLowerCase())
      )
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
    options: {
      handler() {
        this.flattenOptions()
        this.findSelectedNode()
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    this.flattenOptions()
    this.findSelectedNode()
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    // 扁平化树形数据
    flattenOptions() {
      this.flatOptions = []
      this.flattenTree(this.options, 0)
    },
    
    // 递归扁平化
    flattenTree(nodes, level) {
      nodes.forEach(node => {
        this.flatOptions.push({
          ...node,
          level
        })
        if (node.children && node.children.length > 0) {
          this.flattenTree(node.children, level + 1)
        }
      })
    },
    
    // 查找选中的节点
    findSelectedNode() {
      if (!this.selectedId) {
        this.selectedNode = null
        return
      }
      this.selectedNode = this.flatOptions.find(option => option.id === this.selectedId)
    },
    
    // 切换下拉框
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
    
    // 选择选项
    selectOption(option) {
      this.selectedNode = option
      this.selectedId = option.id
      this.$emit('input', option.id)
      this.$emit('change', option)
      this.closeDropdown()
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
.simple-tree-select {
  position: relative;
  display: inline-block;
  width: 100%;
}

.select-input {
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

.select-input:hover {
  border-color: #40a9ff;
}

.select-input.is-focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.select-input.is-disabled {
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

.arrow {
  margin-left: 8px;
  color: #999;
  font-size: 12px;
  transition: transform 0.3s;
}

.arrow.is-reverse {
  transform: rotate(180deg);
}

.select-options {
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

.search-box input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.search-box input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.options-list {
  max-height: 250px;
  overflow-y: auto;
}

.empty {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.option-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  line-height: 1.4;
}

.option-item:hover {
  background-color: #f5f5f5;
}

.option-item.is-selected {
  background-color: #e6f7ff;
  color: #1890ff;
}

.option-text {
  display: block;
}

.select-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

/* 滚动条样式 */
.options-list::-webkit-scrollbar {
  width: 6px;
}

.options-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.options-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.options-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

