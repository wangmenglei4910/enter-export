<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>{{ isEdit ? '编辑标签' : '新增标签' }}</h3>
        <button class="close-btn" @click="handleCancel">×</button>
      </div>
      
      <div class="modal-content">
        <div class="table-container">
          <table class="tag-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>标签分类</th>
                <th>标签名称</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in tagRows" :key="row.id">
                <td>{{ index + 1 }}</td>
                <td>
                  <select 
                    v-model="row.categoryId" 
                    @change="onCategoryChange(row, index)"
                    class="form-select"
                  >
                    <option value="">请选择标签分类</option>
                    <option 
                      v-for="category in tagCategories" 
                      :key="category.id" 
                      :value="category.id"
                    >
                      {{ category.name }}
                    </option>
                  </select>
                </td>
                <td>
                  <select 
                    v-model="row.tagId" 
                    :disabled="!row.categoryId"
                    class="form-select"
                    @focus="loadTagsForCategory(row.categoryId)"
                  >
                    <option value="">请选择标签名称</option>
                    <option 
                      v-for="tag in allTags[row.categoryId] || []" 
                      :key="tag.id" 
                      :value="tag.id"
                    >
                      {{ tag.name }}
                    </option>
                  </select>
                </td>
                <td>
                  <button 
                    class="btn-link primary" 
                    @click="addSubTag(index)"
                  >
                    关联子标签
                  </button>
                  <button 
                    v-if="tagRows.length > 1"
                    class="btn-link danger" 
                    @click="deleteRow(index)"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-primary" @click="handleConfirm">确认</button>
        <button class="btn btn-secondary" @click="handleCancel">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mockApi } from '../mock/tagApi.js'

export default {
  name: 'TagManagementModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    editData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      tagRows: [],
      tagCategories: [],
      allTags: {},
      nextId: 1
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initModal()
      }
    },
    editData: {
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.initEditData()
        }
      },
      deep: true
    }
  },
  mounted() {
    this.loadTagCategories()
  },
  methods: {
    // 初始化弹窗
    initModal() {
      if (this.isEdit && this.editData.length > 0) {
        this.initEditData()
      } else {
        this.initNewData()
      }
    },
    
    // 初始化新增数据
    initNewData() {
      this.tagRows = [{
        id: this.nextId++,
        categoryId: '',
        tagId: ''
      }]
    },
    
    // 初始化编辑数据
    initEditData() {
      this.tagRows = this.editData.map(item => ({
        id: this.nextId++,
        categoryId: item.categoryId || '',
        tagId: item.tagId || ''
      }))
    },
    
    // 加载标签分类数据
    async loadTagCategories() {
      try {
        const response = await mockApi.getTagCategories()
        this.tagCategories = response.data || []
      } catch (error) {
        console.error('加载标签分类失败:', error)
        this.$message && this.$message.error('加载标签分类失败')
      }
    },
    
    // 根据分类ID获取标签名称
    async getTagsByCategory(categoryId) {
      if (!categoryId) return []
      
      // 如果已经缓存了该分类的标签，直接返回
      if (this.allTags[categoryId]) {
        return this.allTags[categoryId]
      }
      
      try {
        const response = await mockApi.getTagsByCategory(categoryId)
        const tags = response.data || []
        // 缓存标签数据
        this.allTags[categoryId] = tags
        return tags
      } catch (error) {
        console.error('加载标签名称失败:', error)
        return []
      }
    },
    
    // 标签分类改变时的处理
    onCategoryChange(row, index) {
      // 清空标签名称选择
      row.tagId = ''
      // 预加载该分类下的标签
      this.loadTagsForCategory(row.categoryId)
    },
    
    // 加载指定分类的标签
    async loadTagsForCategory(categoryId) {
      if (!categoryId || this.allTags[categoryId]) {
        return
      }
      
      try {
        const tags = await this.getTagsByCategory(categoryId)
        this.$set(this.allTags, categoryId, tags)
      } catch (error) {
        console.error('加载标签失败:', error)
      }
    },
    
    // 添加子标签行
    addSubTag(index) {
      const newRow = {
        id: this.nextId++,
        categoryId: '',
        tagId: ''
      }
      this.tagRows.splice(index + 1, 0, newRow)
    },
    
    // 删除行
    deleteRow(index) {
      if (this.tagRows.length > 1) {
        this.tagRows.splice(index, 1)
      }
    },
    
    // 确认操作
    handleConfirm() {
      // 验证数据
      const isValid = this.validateData()
      if (!isValid) {
        return
      }
      
      // 发送数据给父组件
      this.$emit('confirm', this.tagRows)
      this.handleCancel()
    },
    
    // 取消操作
    handleCancel() {
      this.$emit('cancel')
    },
    
    // 点击遮罩层关闭
    handleOverlayClick() {
      this.handleCancel()
    },
    
    // 验证数据
    validateData() {
      for (let i = 0; i < this.tagRows.length; i++) {
        const row = this.tagRows[i]
        if (!row.categoryId) {
          this.$message.error(`第${i + 1}行请选择标签分类`)
          return false
        }
        if (!row.tagId) {
          this.$message.error(`第${i + 1}行请选择标签名称`)
          return false
        }
      }
      return true
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 8px;
  width: 800px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #666;
}

.modal-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.table-container {
  overflow-x: auto;
}

.tag-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.tag-table th,
.tag-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.tag-table th {
  background-color: #fafafa;
  font-weight: 600;
  color: #333;
}

.tag-table tbody tr:hover {
  background-color: #f5f5f5;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  min-width: 150px;
}

.form-select:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-select:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.btn-link {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  margin-right: 8px;
  text-decoration: none;
}

.btn-link.primary {
  color: #1890ff;
}

.btn-link.primary:hover {
  color: #40a9ff;
}

.btn-link.danger {
  color: #ff4d4f;
}

.btn-link.danger:hover {
  color: #ff7875;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e8e8e8;
  background-color: #fafafa;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    margin: 20px;
  }
  
  .modal-content {
    padding: 16px;
  }
  
  .tag-table th,
  .tag-table td {
    padding: 8px 4px;
    font-size: 12px;
  }
  
  .form-select {
    min-width: 120px;
  }
}
</style>
