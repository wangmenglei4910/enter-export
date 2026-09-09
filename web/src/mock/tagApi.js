// 标签管理API模拟数据

// 标签分类数据
export const tagCategories = [
  { id: '1', name: '产品线' },
  { id: '2', name: '产品大类' },
  { id: '3', name: '产品子类' },
  { id: '4', name: '基础产品名称' },
  { id: '5', name: '可售产品名称' },
  { id: '6', name: '风险等级' },
  { id: '7', name: '投资期限' },
  { id: '8', name: '收益类型' }
]

// 标签数据（根据分类ID分组）
export const tagsByCategory = {
  '1': [ // 产品线
    { id: '1', name: '代销债券' },
    { id: '2', name: '自营债券' },
    { id: '3', name: '理财产品' },
    { id: '4', name: '基金产品' }
  ],
  '2': [ // 产品大类
    { id: '5', name: '代销债券' },
    { id: '6', name: '企业债券' },
    { id: '7', name: '政府债券' },
    { id: '8', name: '金融债券' }
  ],
  '3': [ // 产品子类
    { id: '9', name: '代销债券' },
    { id: '10', name: '短期债券' },
    { id: '11', name: '中期债券' },
    { id: '12', name: '长期债券' }
  ],
  '4': [ // 基础产品名称
    { id: '13', name: '代销债券' },
    { id: '14', name: 'AAA级企业债' },
    { id: '15', name: 'AA+级企业债' },
    { id: '16', name: '国债' }
  ],
  '5': [ // 可售产品名称
    { id: '17', name: '代销债券' },
    { id: '18', name: '优质企业债' },
    { id: '19', name: '高收益债券' },
    { id: '20', name: '稳健型债券' }
  ],
  '6': [ // 风险等级
    { id: '21', name: '低风险' },
    { id: '22', name: '中低风险' },
    { id: '23', name: '中等风险' },
    { id: '24', name: '中高风险' },
    { id: '25', name: '高风险' }
  ],
  '7': [ // 投资期限
    { id: '26', name: '1个月以内' },
    { id: '27', name: '1-3个月' },
    { id: '28', name: '3-6个月' },
    { id: '29', name: '6-12个月' },
    { id: '30', name: '1年以上' }
  ],
  '8': [ // 收益类型
    { id: '31', name: '固定收益' },
    { id: '32', name: '浮动收益' },
    { id: '33', name: '保本浮动' },
    { id: '34', name: '非保本浮动' }
  ]
}

// 模拟API调用函数
export const mockApi = {
  // 获取标签分类列表
  getTagCategories: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 200,
          message: 'success',
          data: tagCategories
        })
      }, 300)
    })
  },

  // 根据分类ID获取标签列表
  getTagsByCategory: (categoryId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tags = tagsByCategory[categoryId] || []
        resolve({
          code: 200,
          message: 'success',
          data: tags
        })
      }, 200)
    })
  },

  // 保存标签关联数据
  saveTagRelations: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('保存的标签关联数据:', data)
        resolve({
          code: 200,
          message: '保存成功',
          data: { id: Date.now() }
        })
      }, 500)
    })
  }
}

// 在Vue组件中使用的混入
export const tagApiMixin = {
  methods: {
    // 获取标签分类
    async fetchTagCategories() {
      try {
        const response = await mockApi.getTagCategories()
        return response.data
      } catch (error) {
        console.error('获取标签分类失败:', error)
        return []
      }
    },

    // 根据分类获取标签
    async fetchTagsByCategory(categoryId) {
      try {
        const response = await mockApi.getTagsByCategory(categoryId)
        return response.data
      } catch (error) {
        console.error('获取标签失败:', error)
        return []
      }
    },

    // 保存标签关联
    async saveTagRelations(data) {
      try {
        const response = await mockApi.saveTagRelations(data)
        return response
      } catch (error) {
        console.error('保存标签关联失败:', error)
        throw error
      }
    }
  }
}
