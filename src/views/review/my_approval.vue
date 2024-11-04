<template>
  <div class="request-page">
    <!-- 顶部的选择器、Bucket 属性 和搜索框部分，保持固定位置 -->
    <div class="controls sticky-controls">
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
        <el-table-column prop="BucketName" label="Bucket名称" width="auto"></el-table-column>
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
            <el-button v-if="scope.row.URL" @click="showLinkDialog(scope.row.URL)">
              显示链接
            </el-button>
            <span v-else>无</span>
          </template>
        </el-table-column>

        <el-table-column prop="Comments" label="描述" width="auto"></el-table-column>
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

    <el-dialog v-model="linkDialogVisible" title="复制下载链接" width="400px">
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
const currentUserId = loginStore.userId // 从 store 中获取当前登录用户ID

// 审核列表
const approvals = ref([])

// 控制选择的 bucket 和搜索查询
const searchQuery = ref('')

// 分页控制
const currentPage = ref(1)
const pageSize = ref(10)
const totalApprovals = ref(0)

const linkDialogVisible = ref(false)
const linkToCopy = ref('')

const copyLink = (url:string) => {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        ElMessage({
          type: 'success',
          message: '复制链接成功'
        })
        linkDialogVisible.value = false // 复制后关闭对话框
      })
      .catch((err) => {
        console.error('复制失败:', err)
        ElMessage({
          type: 'error',
          message: '复制失败，请手动复制！'
        })
      })
  } else {
    // 使用传统的textarea方法进行复制
    let textArea = document.createElement('textarea')
    textArea.value = url
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
      ElMessage({
        type: 'error',
        message: '复制失败，请手动复制！'
      })
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

const showLinkDialog = (url: string) => {
  linkToCopy.value = url
  linkDialogVisible.value = true // 显示对话框
}

// 获取审核列表
const fetchApprovals = async () => {
  try {
    // 清空审核列表，避免显示旧数据
    approvals.value = []

    const response = await axiosInstance.get('/user/approval', {
      params: {
        bucket_name: '', // 空 bucket 名称
        file_name: searchQuery.value, // 按照文件名搜索
        request_id: currentUserId, // 当前登录用户ID
        page: currentPage.value,
        page_size: pageSize.value
      }
    })
    const { list, total } = response.data.data
    approvals.value = list
    totalApprovals.value = total
  } catch (error) {
    console.error('获取审核列表失败:', error)
    ElMessage({ type: 'error', message: '获取审核列表失败' })
  }
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

// 组件挂载后获取审核列表
onMounted(() => {
  fetchApprovals()
})

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}
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

.file-table {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.search-box {
  width: 300px;
}
</style>
