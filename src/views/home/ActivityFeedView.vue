<script setup>
import { ref, computed, onMounted } from 'vue'
import { useActivityStore } from '@/stores/activityStore'

const activityStore = useActivityStore()

const selectedMonth = ref(
  `${new Date().getFullYear()}-${String(
    new Date().getMonth() + 1
  ).padStart(2, '0')}`
)

const pageVisits = ref(1)
const pageFollowUps = ref(1)

/* SUMMARY */

const totalVisits = computed(() =>
  activityStore.totalVisits
)

const totalFollowUps = computed(() =>
  activityStore.totalFollowUps
)

const totalPendingFollowUps = computed(() =>
  activityStore.activityFollowUps.filter(
    x => x.status === 'PENDING'
  ).length
)

const totalDoneFollowUps = computed(() =>
  activityStore.activityFollowUps.filter(
    x => x.status === 'DONE'
  ).length
)

/* LOAD */

const loadData = async () => {
  pageVisits.value = 1
  pageFollowUps.value = 1

  await Promise.all([
    activityStore.fetchActivityVisits(
      selectedMonth.value
    ),
    activityStore.fetchActivityFollowUps(
      selectedMonth.value
    )
  ])
}

const refreshData = async () => {
  await loadData()
}

const loadMoreFollowUps = async () => {
  pageFollowUps.value++

  await activityStore.fetchActivityFollowUps(
    selectedMonth.value,
    pageFollowUps.value,
    true
  )
}

onMounted(loadData)

/* HELPERS */

const formatDate = (date) => {
  if (!date) return '-'

  return new Date(date).toLocaleString(
    'id-ID',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  )
}

const statusClass = (status) => {
  if (status === 'DONE') return 'badge-success'
  if (status === 'PENDING') return 'badge-warning'
  return 'badge-light'
}

const followUpTypeClass = (type) => {
  switch (type) {
    case 'CALL':
      return 'badge-primary'

    case 'EMAIL':
      return 'badge-info'

    case 'WHATSAPP':
      return 'badge-success'

    case 'VISIT':
      return 'badge-warning'

    default:
      return 'badge-light'
  }
}
</script>

<template>
  <div class="activity-page">

    <!-- SUMMARY -->
    <div class="summary-grid">
      <div class="summary-card visits">
        <div class="summary-icon">
         <font-awesome-icon icon="location-dot" />
        </div>
        <div>
          <div class="summary-value">{{ totalVisits }}</div>
          <div class="summary-label">Total Visit</div>
        </div>
      </div>

      <div class="summary-card followup">
        <div class="summary-icon">
          <font-awesome-icon icon="phone" />
        </div>
        <div>
          <div class="summary-value">  {{ totalFollowUps }}</div>
          <div class="summary-label">Follow Up</div>
        </div>
      </div>

      <div class="summary-card sales">
        <div class="summary-icon">
          <font-awesome-icon icon="users" />
        </div>
        <div>
          <div class="summary-value"> {{ totalPendingFollowUps }}</div>
         <div class="summary-label">
                Pending Follow Up
                </div>
        </div>
      </div>

      <div class="summary-card deal">
        <div class="summary-icon">
          <font-awesome-icon icon="handshake" />
        </div>
        <div>
          <div class="summary-value">
  {{ totalDoneFollowUps }}
</div>

<div class="summary-label">
  Completed
</div>
        </div>
      </div>
    </div>

    <!-- FILTER -->
    <div class="filter-card">
      <div class="page-title">
        <h4>Activity Feed</h4>
        <span>Recent sales activity history</span>
      </div>

      <div class="filter-right">
      <input
            type="month"
            v-model="selectedMonth"
            @change="loadData"
            />

       <button
  class="btn-refresh"
  @click="refreshData"
>
  <font-awesome-icon icon="rotate-right" />
  Refresh
</button>
      </div>
    </div>

    <!-- TIMELINE -->
    <!-- TIMELINE -->
<div class="activity-card">

  <!-- LOADING -->
  <div
    v-if="activityStore.loadingActivityFollowUps"
    class="loading-state"
  >
    <font-awesome-icon
      icon="spinner"
      spin
    />
    <p>Loading activity...</p>
  </div>

  <!-- DATA -->
  <template v-else>

    <div
      v-for="item in activityStore.activityFollowUps"
      :key="item.id"
      class="activity-item"
    >

      <div
        class="timeline-dot"
        :class="item.status === 'DONE'
          ? 'success'
          : 'warning'"
      ></div>

      <img
        :src="item.sales_photo_url"
        class="avatar"
      />

      <div class="activity-content">

        <div class="activity-top">

          <div>
            <h6>
              {{
                item.sales_name ||
                'System Auto Follow Up'
              }}
            </h6>

            <small>
              {{ item.company_name }}
            </small>
          </div>

          <span class="activity-time">
            {{ formatDate(item.follow_up_at) }}
          </span>

        </div>

        <div class="activity-badges">

          <span
            class="badge"
            :class="followUpTypeClass(item.follow_up_type)"
          >
            {{ item.follow_up_type }}
          </span>

          <span
            class="badge"
            :class="statusClass(item.status)"
          >
            {{ item.status }}
          </span>

          <span
            class="badge badge-light"
          >
            {{ item.target_type }}
          </span>

        </div>

        <p>
          {{ item.subject }}
        </p>

        <small
          v-if="item.completed_at"
          class="activity-time"
        >
          Completed :
          {{ formatDate(item.completed_at) }}
        </small>

      </div>
    </div>

    <!-- EMPTY -->
    <div
      v-if="activityStore.activityFollowUps.length === 0"
      class="empty-state"
    >
      <font-awesome-icon
        icon="inbox"
        class="empty-icon"
      />

      <p>
        No follow-up activities available
      </p>
    </div>

    <!-- LOAD MORE -->
    <div
      v-if="activityStore.hasMoreFollowUps"
      class="load-more"
    >
      <button
        class="btn-refresh"
        @click="loadMoreFollowUps"
      >
        <font-awesome-icon
          icon="angles-down"
        />
        Load More
      </button>
    </div>

  </template>

</div>

  </div>
</template>


<style scoped>
.activity-page{
  padding:24px;
  background:#f5f7fb;
  min-height:100vh;
}

/* SUMMARY */

.summary-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:16px;
  margin-bottom:20px;
}

.summary-card{
  background:white;
  border-radius:14px;
  padding:18px;
  display:flex;
  align-items:center;
  gap:14px;
  box-shadow:0 2px 12px rgba(15,23,42,.06);
}

.summary-icon{
  width:52px;
  height:52px;
  border-radius:12px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:24px;
}

.visits .summary-icon{
  background:#eef2ff;
  color:#6366f1;
}

.followup .summary-icon{
  background:#ecfeff;
  color:#06b6d4;
}

.sales .summary-icon{
  background:#f0fdf4;
  color:#22c55e;
}

.deal .summary-icon{
  background:#fff7ed;
  color:#f97316;
}

.summary-value{
  font-size:24px;
  font-weight:700;
  color:#111827;
}

.summary-label{
  color:#64748b;
  font-size:13px;
}

/* FILTER */

.filter-card{
  background:white;
  border-radius:14px;
  padding:18px 22px;
  margin-bottom:20px;

  display:flex;
  justify-content:space-between;
  align-items:center;

  box-shadow:0 2px 12px rgba(15,23,42,.06);
}

.page-title h4{
  margin:0;
  font-size:18px;
  font-weight:700;
}

.page-title span{
  color:#94a3b8;
  font-size:13px;
}

.filter-right{
  display:flex;
  gap:10px;
}

.filter-right input{
  border:1px solid #dbe2ea;
  border-radius:10px;
  padding:8px 12px;
}

.btn-refresh{
  border:none;
  background:#5856d6;
  color:white;
  border-radius:10px;
  padding:8px 18px;
  cursor:pointer;
}

/* ACTIVITY CARD */

.activity-card{
  background:white;
  border-radius:16px;
  padding:24px;

  box-shadow:0 2px 12px rgba(15,23,42,.06);
}

.activity-item{
  position:relative;

  display:flex;
  gap:18px;

  padding-bottom:30px;
}

.activity-item:not(:last-child)::after{
  content:'';
  position:absolute;

  left:15px;
  top:38px;

  width:2px;
  height:calc(100% - 10px);

  background:#e5e7eb;
}

.timeline-dot{
  width:10px;
  height:10px;
  border-radius:50%;
  margin-top:18px;
  flex-shrink:0;
}

.timeline-dot.success{
  background:#22c55e;
}

.timeline-dot.warning{
  background:#f59e0b;
}

.avatar{
  width:52px;
  height:52px;
  border-radius:50%;
  object-fit:cover;
}

.activity-content{
  flex:1;
  background:#fafbfc;
  border:1px solid #eef2f7;
  border-radius:14px;
  padding:16px;
}

.activity-top{
  display:flex;
  justify-content:space-between;
  margin-bottom:12px;
}

.activity-top h6{
  margin:0;
  font-size:15px;
  font-weight:600;
}

.activity-top small{
  color:#64748b;
}

.activity-time{
  color:#94a3b8;
  font-size:12px;
}

.activity-badges{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  margin-bottom:12px;
}

.badge{
  padding:5px 10px;
  border-radius:999px;
  font-size:11px;
  font-weight:600;
}

.badge-primary{
  background:#eef2ff;
  color:#6366f1;
}

.badge-success{
  background:#dcfce7;
  color:#15803d;
}

.badge-info{
  background:#cffafe;
  color:#0891b2;
}

.badge-warning{
  background:#fef3c7;
  color:#b45309;
}

.badge-light{
  background:#f1f5f9;
  color:#64748b;
}

.activity-content p{
  margin:0;
  color:#475569;
  line-height:1.6;
}


.loading-state{
  text-align:center;
  padding:40px;
  color:#64748b;
}

.loading-state svg{
  font-size:30px;
  margin-bottom:10px;
}

.empty-state{
  text-align:center;
  padding:40px;
  color:#94a3b8;
}

.empty-icon{
  font-size:50px;
  margin-bottom:12px;
}

.load-more{
  margin-top:20px;
  display:flex;
  justify-content:center;
}

.load-more button{
  display:flex;
  align-items:center;
  gap:8px;
}


/* =========================
   TABLET
========================= */
@media (max-width: 992px) {

  .activity-page{
    padding:16px;
  }

  .summary-grid{
    grid-template-columns:repeat(2,1fr);
  }

  .filter-card{
    flex-direction:column;
    align-items:flex-start;
    gap:16px;
  }

  .filter-right{
    width:100%;
  }

  .filter-right input{
    flex:1;
    width:100%;
  }

  .btn-refresh{
    white-space:nowrap;
  }
}

/* =========================
   MOBILE
========================= */
@media (max-width: 768px){

  .activity-page{
    padding:12px;
  }

  .summary-grid{
    grid-template-columns:1fr;
    gap:12px;
  }

  .summary-card{
    padding:14px;
  }

  .summary-icon{
    width:44px;
    height:44px;
    font-size:20px;
  }

  .summary-value{
    font-size:20px;
  }

  .filter-card{
    padding:14px;
  }

  .page-title h4{
    font-size:16px;
  }

  .filter-right{
    width:100%;
    flex-direction:column;
  }

  .filter-right input{
    width:100%;
  }

  .btn-refresh{
    width:100%;
    justify-content:center;
  }

  .activity-card{
    padding:16px;
  }

  .activity-item{
    gap:12px;
  }

  .avatar{
    width:42px;
    height:42px;
  }

  .activity-item:not(:last-child)::after{
    left:10px;
  }

  .timeline-dot{
    width:8px;
    height:8px;
    margin-top:16px;
  }

  .activity-content{
    padding:12px;
  }

  .activity-top{
    flex-direction:column;
    gap:6px;
  }

  .activity-time{
    font-size:11px;
  }

  .activity-badges{
    gap:6px;
  }

  .badge{
    font-size:10px;
    padding:4px 8px;
  }

  .activity-content p{
    font-size:13px;
    line-height:1.5;
  }
}

.activity-top h6,
.activity-top small,
.activity-content p{
  word-break: break-word;
}

.activity-card,
.summary-card,
.filter-card{
  border: 1px solid #e9edf4;
}

.activity-content{
  transition: all .25s ease;
}

.activity-content:hover{
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,.06);
}

.summary-card{
  transition: all .25s ease;
}

.summary-card:hover{
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0,0,0,.08);
}

/* =========================
   SMALL MOBILE
========================= */
@media (max-width: 480px){

  .summary-card{
    gap:10px;
  }

  .summary-icon{
    width:40px;
    height:40px;
    font-size:18px;
  }

  .summary-value{
    font-size:18px;
  }

  .summary-label{
    font-size:11px;
  }

  .page-title h4{
    font-size:15px;
  }

  .page-title span{
    font-size:11px;
  }

  .activity-card{
    padding:12px;
    border-radius:12px;
  }

  .avatar{
    width:38px;
    height:38px;
  }

  .activity-content{
    padding:10px;
  }

  .activity-top h6{
    font-size:13px;
  }

  .activity-top small{
    font-size:11px;
  }

  .activity-content p{
    font-size:12px;
  }

  .badge{
    font-size:9px;
  }
}
</style>