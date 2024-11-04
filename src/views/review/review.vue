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
        @keyup.enter="fetchApprovals"
        placeholder="搜索文件名称"
        class="search-box"
      >
        <template #append>
          <el-button icon="el-icon-search" @click="fetchApprovals">搜索</el-button>
        </template>
      </el-input>
    </div>

    <!-- 审核列表表格部分 -->
    <div class="file-table">
      <!-- 检查 approvals 是否为空 -->
      <el-table v-if="totalApprovals > 0" :data="approvals" stripe style="width: 100%">
        <el-table-column prop="FileKey" label="文件Key" width="auto"></el-table-column>
        <el-table-column prop="FileName" label="文件名称" width="auto"></el-table-column>
        <el-table-column prop="RequestUser" label="请求用户" width="auto"></el-table-column>
        <el-table-column label="审核员" width="auto">
          <template #default="scope">
            {{ scope.row.ApproveUser ? scope.row.ApproveUser : '-' }}
          </template>
        </el-table-column>

        <!-- 格式化创建日期 -->
        <el-table-column label="申请日期" width="auto">
          <template #default="scope">
            {{ formatDate(scope.row.CreatedAt) }}
          </template>
        </el-table-column>

        <!-- 格式化更新日期 -->
        <el-table-column label="审核日期" width="auto">
          <template #default="scope">
            <span v-if="scope.row.ApprovedAt === '0001-01-01T00:00:00Z' || !scope.row.ApprovedAt">
              -
            </span>
            <span v-else>
              {{ formatDate(scope.row.ApprovedAt) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="过期时间" width="auto">
          <template #default="scope">
            <span v-if="scope.row.Expires === '0001-01-01T00:00:00Z' || !scope.row.Expires">
              -
            </span>
            <span v-else>
              {{ formatDate(scope.row.Expires) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="是否通过" width="auto">
          <template #default="scope">
            <el-tag
              :type="
                scope.row.ApprovedAt === '0001-01-01T00:00:00Z'
                  ? 'warning'
                  : scope.row.IsApproved
                    ? 'success'
                    : 'danger'
              "
            >
              {{
                scope.row.ApprovedAt === '0001-01-01T00:00:00Z'
                  ? '待审核'
                  : scope.row.IsApproved
                    ? '通过'
                    : '未通过'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="URL" label="下载链接" width="auto">
          <template #default="scope">
            <el-button v-if="scope.row.URL" @click="showLinkDialog(scope.row.URL)"
              >显示链接</el-button
            >
            <span v-else>无</span>
          </template>
        </el-table-column>
        <el-table-column prop="Comments" label="描述" width="auto"></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              @click="handleApprove(scope.row)"
              :disabled="scope.row.ApprovedAt !== '0001-01-01T00:00:00Z'"
            >
              通过
            </el-button>
            <el-button
              @click="handleReject(scope.row)"
              :disabled="scope.row.ApprovedAt !== '0001-01-01T00:00:00Z'"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 如果 approvals 为空，则显示空数据提示 -->
      <el-empty v-else description="暂无数据"></el-empty>
    </div>

    <!-- 分页器部分 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalApprovals"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50, 100]"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      ></el-pagination>
    </div>

    <!-- 审核通过的对话框 -->
    <el-dialog v-model="approveDialogVisible" title="选择链接有效期">
      <el-form :model="approveForm" label-width="150px">
        <el-form-item label="链接有效期 (小时)">
          <el-input-number v-model="approveForm.expires" :min="1"></el-input-number>
        </el-form-item>
      </el-form>
      <template v-slot:footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApproval">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="linkDialogVisible" title="复制下载链接" width="400px" style="z-index: 3000">
      <div class="link-container">
        {{ linkToCopy }}
      </div>
      <template #footer>
        <el-button @click="copyLink(linkToCopy)">复制链接</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import axiosInstance from '@/utils/api'
import { ElMessage } from 'element-plus'
import { useLoginStore } from '@/stores/login'

// 使用 loginStore 获取当前用户ID
const loginStore = useLoginStore()
const currentUserId = loginStore.userId

// Bucket 列表
interface Bucket {
  bucket_name: string
  is_public: boolean
}

const buckets = ref<Bucket[]>([])
const selectedBucket = ref('')
const isPublic = ref(false)

// 审核列表
const approvals = ref([])

// 控制选择的 bucket 和搜索查询
const searchQuery = ref('')

// 分页控制
const currentPage = ref(1)
const pageSize = ref(10)
const totalApprovals = ref(0)

// 审核通过对话框控制
const approveDialogVisible = ref(false)
const approveForm = ref({
  expires: 3,
  approvalId: 0
})

const linkDialogVisible = ref(false)
const linkToCopy = ref('')

// 显示链接和对话框的方法
const showLinkDialog = (url: string) => {
  console.log('Dialog should show now')
  linkToCopy.value = url
  linkDialogVisible.value = true
}

// 实际复制链接的方法
const copyLink = (url: string) => {
  // 检查 navigator.clipboard 是否可用
  if (navigator.clipboard && window.isSecureContext) {
    // 使用 navigator.clipboard API
    navigator.clipboard
      .writeText(url)
      .then(() => {
        ElMessage({
          type: 'success',
          message: '复制链接成功'
        })
        linkDialogVisible.value = false
      })
      .catch((err) => {
        console.error('复制失败:', err)
        ElMessage({
          type: 'error',
          message: '复制失败，请手动复制！'
        })
      })
  } else {
    // 使用传统的方法创建 textarea 进行复制
    const textArea = document.createElement('textarea')
    textArea.value = url
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      let successful = document.execCommand('copy')
      let msg = successful ? '成功复制到剪贴板' : '复制失败'
      ElMessage({
        type: successful ? 'success' : 'error',
        message: msg
      })
    } catch (err) {
      console.error('复制失败:', err)
      ElMessage({
        type: 'error',
        message: '复制失败，请手动复制！'
      })
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

// 获取 bucket 列表
const fetchBuckets = async () => {
  try {
    const response = await axiosInstance.get('/user/bucket_user')
    buckets.value = response.data.data

    // 如果 buckets 列表不为空，设置第一个 bucket 为默认选中
    if (buckets.value.length > 0) {
      selectedBucket.value = buckets.value[0].bucket_name
      isPublic.value = buckets.value[0].is_public // 获取当前 Bucket 的类型
      fetchApprovals() // 在设置完 bucket 后自动加载文件
    }
  } catch (error) {
    console.error('获取 Bucket 列表失败:', error)
  }
}

// 获取审核列表
const fetchApprovals = async () => {
  try {
    // 清空审核列表，避免显示旧数据
    approvals.value = []

    const response = await axiosInstance.get('/user/approval', {
      params: {
        bucket_name: selectedBucket.value,
        file_name: searchQuery.value,
        page: currentPage.value,
        page_size: pageSize.value
      }
    })
    const { list, total } = response.data.data
    approvals.value = list
    totalApprovals.value = total
  } catch (error) {
    console.error('获取审核列表失败:', error)
  }
}

// 当选择 Bucket 变化时
const handleBucketChange = () => {
  // 将页码重置为 1
  currentPage.value = 1
  fetchApprovals()
}

const handleApprove = (approval: { ID: number }) => {
  approveForm.value.approvalId = approval.ID // 设置当前审批 ID
  approveDialogVisible.value = true // 显示对话框
}

const submitApproval = async () => {
  console.log(approveForm.value)
  try {
    await axiosInstance.put('/user/approval', {
      id: approveForm.value.approvalId, // 审批ID
      is_approved: true, // 审核通过
      approve_id: currentUserId,
      expires: approveForm.value.expires // 链接有效期
    })
    ElMessage({ type: 'success', message: '审批通过成功' })
    approveDialogVisible.value = false // 关闭对话框
    fetchApprovals() // 刷新审批列表
  } catch (error) {
    ElMessage({ type: 'error', message: '审批通过失败' })
  }
}

const handleReject = async (approval: { ID: number }) => {
  try {
    await axiosInstance.put('/user/approval', {
      id: approval.ID, // 审批ID
      is_approved: false, // 审核拒绝
      approve_id: currentUserId
    })
    ElMessage({ type: 'success', message: '审批拒绝成功' })
    fetchApprovals() // 刷新审批列表
  } catch (error) {
    ElMessage({ type: 'error', message: '审批拒绝失败' })
  }
}

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 处理分页
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchApprovals()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  fetchApprovals()
}

// 组件挂载后获取 bucket 列表和审核列表
onMounted(() => {
  fetchBuckets()
  fetchApprovals()
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
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid #ebeef5;
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
  margin-top: 20px;
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
