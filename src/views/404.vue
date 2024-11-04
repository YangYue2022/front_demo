<template>
  <div class="flex-center">
    <div class="content-wrapper">
      <img src="@/assets/icons/404.svg" alt="404" />
  
      <div class="text-content">
        <p class="font-medium text-4xl mb-4">404</p>
        <p class="mb-4 text-gray-500">抱歉，你访问的页面不存在</p>
        <el-button type="primary" @click="$router.push('/')">
          返回首页
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh; /* Fills the viewport height */
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center; /* Centers the text inside the div */
}

.icon-size {
  width: 200px; /* Adjust width as needed */
  height: 190px; /* Adjust height as needed */
}

.text-content {
  margin-top: 20px; /* Adjust the space above the text content */
}

.font-medium {
  font-weight: 500;
  color: black;
}

.text-4xl {
  font-size: 2.25rem; /* Suitable for large titles */
}

.mb-4 {
  margin-bottom: 1rem; /* Adjust the margin as needed */
}

.text-gray-500 {
  color: #6b7280; /* Set the text color to gray */
}

/* Button styling */
.el-button {
  margin-top: 20px; /* Space above the button */
}
</style>
