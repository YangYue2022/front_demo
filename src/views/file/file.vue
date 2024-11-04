<template>
  <div class="request-page">
    <!-- 顶部的选择器、Bucket 属性 和搜索框部分，保持固定位置 -->
    <div class="controls sticky-controls">
      <!-- 显示当前 Bucket 属性 -->
      <div class="bucket-type">
        <span v-if="isPublic === true">公开库</span>
        <span v-else>私有库</span>
      </div>

      <!-- 设置下拉框宽度 -->
      <el-select
        v-model="selectedBucket"
        placeholder="选择 Bucket"
        @change="handleBucketChange"
        style="width: 200px"
      >
        <el-option
          v-for="bucket in buckets"
          :key="bucket.bucket_name"
          :label="bucket.bucket_name"
          :value="bucket.bucket_name"
        ></el-option>
      </el-select>

      <!-- 搜索框和搜索按钮 -->
      <el-input
        v-model="searchQuery"
        @keyup.enter="fetchFiles"
        placeholder="搜索文件名称"
        class="search-box"
      >
        <template #append>
          <el-button icon="el-icon-search" @click="fetchFiles">搜索</el-button>
        </template>
      </el-input>

      <!-- 修改 Bucket 属性的按钮 -->
      <el-dropdown class="dropdown-bucket-type">
        <span class="el-dropdown-link">
          修改属性<i class="el-icon-arrow-down el-icon--right"></i>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="changeBucketType">
              修改为 {{ isPublic ? '私有库' : '公开库' }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 文件列表表格部分 -->
    <div class="file-table">
      <!-- 检查 fileList 是否为空 -->
      <el-table v-if="fileList.length > 0" :data="fileList" stripe style="width: 100%">
        <el-table-column prop="FileKey" label="文件Key" width="auto"></el-table-column>
        <el-table-column prop="bucket_name" label="Bucket名称" width="auto"></el-table-column>
        <el-table-column prop="file_name" label="文件名称" width="auto"></el-table-column>
        <el-table-column label="文件大小" width="auto">
          <template #default="scope">
            {{ formatFileSize(scope.row.size) }}
          </template>
        </el-table-column>

        <!-- 格式化创建日期 -->
        <el-table-column label="上传日期" width="auto">
          <template #default="scope">
            {{ formatDate(scope.row.CreatedAt) }}
          </template>
        </el-table-column>

        <!-- 格式化更新日期 -->
        <el-table-column label="更新日期" width="auto">
          <template #default="scope">
            {{ formatDate(scope.row.UpdatedAt) }}
          </template>
        </el-table-column>

        <el-table-column prop="comments" label="描述" width="auto"></el-table-column>
        <el-table-column label="操作" width="auto" fixed="right">
          <template #default="scope">
            <el-button @click="handleEdit(scope.row)">编辑</el-button>
            <el-button @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 如果 fileList 为空，则显示空数据提示 -->
      <el-empty v-else description="暂无数据"></el-empty>
    </div>

    <!-- 分页器部分 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalFiles"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50, 100]"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      ></el-pagination>
    </div>
  </div>

  <!-- 右侧抽屉组件，用于编辑文件 -->
  <el-drawer v-model="drawerVisible" direction="rtl" size="30%" title="编辑文件">
    <el-form :model="editForm" label-width="100px">
      <el-form-item label="文件Key">
        <el-input v-model="editForm.file_key" disabled></el-input>
      </el-form-item>
      <el-form-item label="Bucket名称">
        <el-input v-model="editForm.bucket_name" disabled></el-input>
      </el-form-item>
      <el-form-item label="文件名称">
        <el-input v-model="editForm.file_name"></el-input>
      </el-form-item>
      <el-form-item label="文件大小">
        <el-input v-model="editForm.size" disabled></el-input>
      </el-form-item>
      <el-form-item label="描述">
        <el-input type="textarea" v-model="editForm.comments"></el-input>
      </el-form-item>
    </el-form>
    <template v-slot:footer>
      <span class="dialog-footer">
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">完成</el-button>
      </span>
    </template>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue'
import dayjs from 'dayjs'
import { ElMessageBox, ElMessage } from 'element-plus'
import axiosInstance from '@/utils/api' // 你的 axios 实例

interface Bucket {
  bucket_name: string
  is_public: boolean
}

const buckets = ref<Bucket[]>([])

const selectedBucket = ref('')
const isPublic = ref(false) // 控制当前 Bucket 的公开或私有状态

// 文件列表
const fileList = ref([])

// 控制选择的 bucket 和搜索查询
const searchQuery = ref('')

// 分页控制
const currentPage = ref(1)
const pageSize = ref(10)
const totalFiles = ref(0)

// 控制抽屉显示和表单
const drawerVisible = ref(false)
const editForm = ref({
  file_name: '',
  comments: '',
  file_key: '',
  bucket_name: '',
  size: 0
})

// 获取 bucket 列表
const fetchBuckets = async () => {
  try {
    const response = await axiosInstance.get('/user/bucket_user')
    buckets.value = response.data.data

    // 如果 buckets 列表不为空，设置第一个 bucket 为默认选中
    if (buckets.value.length > 0) {
      selectedBucket.value = buckets.value[0].bucket_name
      isPublic.value = buckets.value[0].is_public // 获取当前 Bucket 的类型
      // 确保视图和 DOM 完全更新后再加载文件
      await nextTick() // 确保所有的 DOM 更新都完成了
      fetchFiles() // 在设置完 bucket 后自动加载文件
    }
  } catch (error) {
    console.error('获取 Bucket 列表失败:', error)
  }
}

// 获取文件列表
const fetchFiles = async () => {
  try {
    // 清空文件列表，避免显示旧数据
    fileList.value = []

    const response = await axiosInstance.get('/user/file', {
      params: {
        bucket_name: selectedBucket.value,
        file_name: searchQuery.value,
        page: currentPage.value,
        page_size: pageSize.value
      }
    })
    if (response.data.code === 0) {
      const { list, total } = response.data.data
      fileList.value = list
      totalFiles.value = total
    }
  } catch (error) {
    console.error('获取文件列表失败:', error)
  }
}

// 当选择 Bucket 变化时
const handleBucketChange = () => {
  const currentBucket = buckets.value.find((bucket) => bucket.bucket_name === selectedBucket.value)
  if (currentBucket) {
    isPublic.value = currentBucket.is_public // 更新 Bucket 类型
  }

  console.log(isPublic.value)

  // 将页码重置为 1
  currentPage.value = 1
  fetchFiles()
}

// 修改Buket类型
const changeBucketType = async () => {
  try {
    const newType = isPublic.value ? 'private' : 'public'
    ElMessageBox.confirm(
      `确定要将此Bucket修改为${isPublic.value ? '私有库' : '公开库'}吗？`,
      '确认修改属性',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(async () => {
        await axiosInstance.put(`/user/bucket?bucket_name=${selectedBucket.value}&type=${newType}`)
        isPublic.value = !isPublic.value // 更新本地的 Bucket 类型
        fetchBuckets() // 重新加载 bucket 列表
        fetchFiles() // 重新加载数据
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '已取消修改'
        })
      })
  } catch (error) {
    console.error('修改 Bucket 类型失败:', error)
  }
}

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化文件大小
const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes === 0) return '0 Bytes'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024))
  return parseFloat((sizeInBytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}

// 点击编辑按钮时触发，显示抽屉并加载文件数据
const handleEdit = (file: {
  FileKey: string
  file_name: string
  bucket_name: string
  comments: string
  file_key: string
  size: number
}) => {
  editForm.value.file_key = file.FileKey
  editForm.value.file_name = file.file_name
  editForm.value.bucket_name = file.bucket_name
  editForm.value.size = file.size
  editForm.value.comments = file.comments
  drawerVisible.value = true
}

// 提交编辑
const submitEdit = async () => {
  try {
    await axiosInstance.put('/user/file', editForm.value)
    drawerVisible.value = false
    fetchFiles() // 编辑完成后刷新文件列表
  } catch (error) {
    console.error('编辑文件失败:', error)
  }
}

// 点击删除按钮时，弹出确认框
const handleDelete = (file: { file_key: string; FileKey: string }) => {
  ElMessageBox.confirm('确定要删除该文件吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        // 调用后端的删除接口
        await axiosInstance.delete(`/user/file`, {
          params: {
            file_key: file.FileKey
          }
        })
        ElMessage({
          type: 'success',
          message: '文件删除成功'
        })
        fetchFiles() // 删除完成后刷新文件列表
      } catch (error) {
        console.error('删除文件失败:', error)
        ElMessage({
          type: 'error',
          message: '删除文件失败'
        })
      }
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '已取消删除'
      })
    })
}

// 处理分页
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchFiles()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  fetchFiles()
}

// 组件挂载后获取文件和 bucket 列表
onMounted(() => {
  fetchBuckets()
})
</script>

<style scoped>
.request-page {
  padding: 20px;
}

.sticky-controls {
  background-color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between; /* 将内容左右对齐 */
  position: sticky; /* 让这个部分在页面滚动时固定住 */
  top: 0;
  z-index: 1000; /* 设置较高的 z-index 确保其在滚动时覆盖其他内容 */
  border-bottom: 1px solid #ebeef5; /* 增加底部边框让固定部分更明显 */
}

.bucket-type {
  font-weight: bold;
  color: black;
  margin-right: 20px;
}

.dropdown-bucket-type {
  margin-left: auto;
}

.file-table {
  margin-top: 20px; /* 添加一些间距使表格与搜索框区分开 */
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.search-box {
  margin-left: 20px;
  width: 300px;
}

.el-drawer {
  z-index: 2000 !important; /* 强制设置较高的 z-index */
}
</style>
