<template>
  <div class="tag-management-example">
    <div class="page-header">
      <h2>标签管理示例</h2>
      <div class="action-buttons">
        <button class="btn btn-primary" @click="showAddModal">新增标签</button>
        <button class="btn btn-secondary" @click="showEditModal">编辑标签</button>
      </div>
    </div>
    
    <div class="content">
      <p>点击上方按钮可以打开标签管理弹窗进行测试。</p>
      
      <!-- 显示当前保存的数据 -->
      <div v-if="savedData.length > 0" class="saved-data">
        <h3>已保存的标签数据：</h3>
        <div class="data-list">
          <div v-for="(item, index) in savedData" :key="index" class="data-item">
            <span class="index">{{ index + 1 }}.</span>
            <span class="category">分类ID: {{ item.categoryId }}</span>
            <span class="tag">标签ID: {{ item.tagId }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 标签管理弹窗 -->
    <TagManagementModal
      :visible="modalVisible"
      :isEdit="isEditMode"
      :editData="editData"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script>
import TagManagementModal from './TagManagementModal.vue'

export default {
  name: 'TagManagementExample',
  components: {
    TagManagementModal
  },
  data() {
    return {
      modalVisible: false,
      isEditMode: false,
      editData: [],
      savedData: []
    }
  },
  methods: {
    // 显示新增弹窗
    showAddModal() {
      this.isEditMode = false
      this.editData = []
      this.modalVisible = true
    },
    
    // 显示编辑弹窗
    showEditModal() {
      this.isEditMode = true
      // 模拟编辑数据
      this.editData = [
        { categoryId: '1', tagId: '1' },
        { categoryId: '2', tagId: '3' }
      ]
      this.modalVisible = true
    },
    
    // 确认操作
    handleConfirm(data) {
      console.log('确认的数据:', data)
      this.savedData = [...data]
      this.$message.success('标签数据保存成功！')
    },
    
    // 取消操作
    handleCancel() {
      this.modalVisible = false
      this.isEditMode = false
      this.editData = []
    }
  }
}
</script>

<style scoped>
.tag-management-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e8e8e8;
}

.page-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  min-width: 100px;
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

.content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.saved-data {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

.saved-data h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
}

.data-item .index {
  font-weight: 600;
  color: #1890ff;
  min-width: 20px;
}

.data-item .category,
.data-item .tag {
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: flex-start;
  }
  
  .data-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>
