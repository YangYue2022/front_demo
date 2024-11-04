<template>
  <div class="request-page">
    <!-- 顶部的选择器和搜索框部分，保持固定位置 -->
    <div class="controls sticky-controls">
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
            <el-button @click="showApplyDialog(scope.row)">申请</el-button>
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

    <!-- 申请文件对话框 -->
    <el-dialog v-model="applyDialogVisible" title="申请文件" width="30%">
      <el-form :model="applyForm">
        <el-form-item label="描述">
          <el-input type="textarea" v-model="applyForm.comments"></el-input>
        </el-form-item>
      </el-form>
      <template v-slot:footer>
        <span class="dialog-footer">
          <el-button @click="applyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitApply">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 显示成功申请的对话框 -->
    <el-dialog v-model="resultDialogVisible" title="申请结果" width="30%">
      <p v-if="downloadUrl">申请成功，<a :href="downloadUrl" target="_blank">点击下载文件</a></p>
      <p v-else>此文件属于私有库，请联系审核员通过申请。</p>
      <template v-slot:footer>
        <span class="dialog-footer">
          <el-button @click="resultDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue'
import dayjs from 'dayjs'
import axiosInstance from '@/utils/api' // 你的 axios 实例
import { useLoginStore } from '@/stores/login' // 导入登录状态

// Bucket 列表
interface Bucket {
  bucket_name: string
  is_public: boolean
}

const buckets = ref<Bucket[]>([])

// 文件列表
const fileList = ref([])

// 控制选择的 bucket 和搜索查询
const selectedBucket = ref('')
const searchQuery = ref('')

// 分页控制
const currentPage = ref(1)
const pageSize = ref(10)
const totalFiles = ref(0)

// 申请文件相关数据
const applyDialogVisible = ref(false)
const resultDialogVisible = ref(false)
const applyForm = ref({ file_key: '', comments: '' })
const downloadUrl = ref('')

// 获取 bucket 列表
const fetchBuckets = async () => {
  try {
    const response = await axiosInstance.get('/user/bucket')
    buckets.value = response.data.data

    // 如果 buckets 列表不为空，设置第一个 bucket 为默认选中
    if (buckets.value.length > 0) {
      selectedBucket.value = buckets.value[0].bucket_name
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
    if (response.data.data) {
      const { list, total } = response.data.data
      fileList.value = list
      totalFiles.value = total
    }
  } catch (error) {
    console.error('获取文件列表失败:', error)
  }
}

// 显示申请文件对话框
const showApplyDialog = (file: { file_key: string; FileKey: string }) => {
  applyForm.value.file_key = file.FileKey
  applyForm.value.comments = ''
  applyDialogVisible.value = true
}

// 提交申请
const submitApply = async () => {
  const loginStore = useLoginStore() // 获取当前用户信息
  try {
    const response = await axiosInstance.post('/user/approval', {
      file_key: applyForm.value.file_key,
      request_user_id: loginStore.userId, // 从登录状态中获取用户ID
      comments: applyForm.value.comments
    })

    if (response.data.data) {
      downloadUrl.value = response.data.data.url
    } else {
      downloadUrl.value = ''
    }

    applyDialogVisible.value = false
    resultDialogVisible.value = true
  } catch (error) {
    console.error('申请文件失败:', error)
  }
}

// 当选择 Bucket 变化时
const handleBucketChange = () => {
  // 将页码重置为 1
  currentPage.value = 1
  fetchFiles()
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
  position: sticky; /* 让这个部分在页面滚动时固定住 */
  top: 0;
  z-index: 1000; /* 设置较高的 z-index 确保其在滚动时覆盖其他内容 */
  border-bottom: 1px solid #ebeef5; /* 增加底部边框让固定部分更明显 */
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
</style>
