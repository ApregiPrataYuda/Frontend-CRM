import {
  createRouter,
  createWebHistory
} from 'vue-router'

import DefaultLayout from '@/layouts/DefaultLayout.vue'

import NotFoundView from '@/views/error/NotFoundView.vue'

import UnauthorizedView from '@/views/error/UnauthorizedView.vue'

import { useAuthStore } from '@/stores/authStore'
import { useSidebarStore } from '@/stores/sidebarStore'
import { usePermissionStore } from '@/stores/PermissionStore'



const routes = [

  /* ========================================
     ROOT
  ========================================= */

  {
    path: '/',
    redirect: '/home',
  },

  /* ========================================
     PUBLIC
  ========================================= */

  {
    path: '/home',
    name: 'Home',
    component: () =>
      import('@/views/home/HomeView.vue'),
  },

  {
    path: '/maps-tracking',
    name: 'MapsTracking',
    component: () =>
      import('@/views/home/MapsTrackingView.vue'),
  },

  {
    path: '/history/monitoring/sales/data',
    name: 'DataVisitsAllData',
    component: () =>
      import('@/views/home/DataVisitsAllDataView.vue'),
  },

  {
    path: '/dashboard/all-data',
    name: 'DashboardHome',
    component: () =>
      import('@/views/home/DashboardHomeView.vue'),
  },

  {
    path: '/activity/feed',
    name: 'ActivityFeed',
    component: () =>
      import('@/views/home/ActivityFeedView.vue'),
  },

  /* ========================================
     GUEST ONLY
  ========================================= */

  {
    path: '/login',
    name: 'Login',

    component: () =>
      import('@/views/auth/LoginView.vue'),

    meta: {
      guest: true
    }
  },

  {
    path: '/register',
    name: 'Register',

    component: () =>
      import('@/views/auth/RegisterView.vue'),

    meta: {
      guest: true
    }
  },

  {
    path: '/forgot-password',
    name: 'ForgotPassword',

    component: () =>
      import('@/views/auth/ForgotPasswordView.vue'),

    meta: {
      guest: true
    }
  },

  {
    path: '/user-reset-password',
    name: 'UserResetPassword',

    component: () =>
      import('@/views/auth/ResetPasswordView.vue'),

    meta: {
      guest: true
    }
  },

  /* ========================================
     AUTHENTICATED LAYOUT
  ========================================= */

  {
    path: '/app',

    component: DefaultLayout,

    meta: {
      auth: true
    },

    children: [

      /* ========================================
         ADMIN
      ========================================= */
       
      {
        path: 'administrator-dashboard',

        name: 'AdministratorDashboard',

        component: () =>
          import('@/views/administrator/dashboard/DashboardView.vue'),

        meta: {
          role: [1], title: 'Dashboard Admin IT'
        }
      },

      {
        path: 'administrator-menu',

        name: 'AdministratorMenu',

        component: () =>
          import('@/views/administrator/menu/MenuManagementView.vue'),

        meta: {
          role: [1],  title: 'Menu Management' 
        }
      },

      {
        path: 'administrator-submenu',

        name: 'AdministratorSubMenu',

        component: () =>
          import('@/views/administrator/submenu/SubMenuManagementView.vue'),

        meta: {
          role: [1],  title: 'Sub Menu Management' 
        }
      },


      {
        path: 'administrator-role',

        name: 'AdministratorRole',

        component: () =>
          import('@/views/administrator/role/RoleManagementView.vue'),

        meta: {
          role: [1],  title: 'Role Management' 
        }
      },

      {
        path: 'administrator-users',

        name: 'AdministratorUsers',

        component: () =>
          import('@/views/administrator/user/UserManagementView.vue'),

        meta: {
          role: [1],  title: 'User Management' 
        }
      },

      {
        path: 'setting-app-global',
        name: 'SettingAppGlobal',

        component: () =>
          import('@/views/administrator/setting/SettingAppGlobalView.vue'),

        meta: {
          role: [1],  title: 'Setting Management' 
        }
      },


      {
        path: 'data-master-employee',
        name: 'MasterEmploye',

        component: () =>
          import('@/views/administrator/employe/EmployeManagementView.vue'),

        meta: {
          role: [1],  title: 'Employe Management' 
        }
      },

      /* ========================================
         SALES
      ========================================= */

      {
        path: 'sales-home',

        name: 'SalesHome',

        component: () =>
          import('@/views/sales/home/HomeSalesView.vue'),

        meta: {
          role: [2], title: 'Sales Home'
        }
      },


      {
        path: 'sales-timesheets-leave-attendance',

        name: 'SalesTimesheetsLeaveAttendance',

        component: () =>
          import('@/views/sales/attendance/AttendanceView.vue'),

        meta: {
          role: [2], title: 'Sales Attendance'
        }
      },


       {
        path: 'sales-timesheets-leave-reports',

        name: 'SalesTimesheetsLeaveReports',

        component: () =>
          import('@/views/sales/attendance/ReportAttendanceView.vue'),

        meta: {
          role: [2], title: 'Attendance Reports'
        }
      },

      {
        path: 'sales-timesheets-leave-reports-history',

        name: 'SalesTimesheetsLeaveReportsHistory',

        component: () =>
          import('@/views/sales/attendance/AttendanceHistoryView.vue'),

        meta: {
          role: [2], title: 'Reports History'
        }
      },



      {
        path: 'sales-leads',
        name: 'SalesLeads',

        component: () =>
          import('@/views/sales/leads/LeadsManagementView.vue'),

        meta: {
          role: [2], title: 'Leads Management'
        }
      },

      {
        path: 'data-master-leads-assign',
        name: 'SalesLeadsAssign',

        component: () =>
          import('@/views/sales/leads/LeadsAssigntToSalesView.vue'),

        meta: {
          role: [2], title: 'Leads Assignment'
        }
      },

      {
        path: 'sales-customers',
        name: 'SalesCustomers',

        component: () =>
          import('@/views/sales/customers/CustomersManagementView.vue'),

        meta: {
          role: [2], title: 'Customers Management'
        }
      },

      {
        path: 'sales-visit',
        name: 'SalesVisit',

        component: () =>
          import('@/views/sales/visit/SalesVisitView.vue'),

        meta: {
          role: [2], title: 'Sales Visit Data'
        }
      },


      {
        path: 'sales-follow-up',
        name: 'SalesFollowUp',

        component: () =>
          import('@/views/sales/followup/FollowUpManagementView.vue'),

        meta: {
          role: [2], title: 'Sales Follow Up'
        }
      },



      {
        path: 'reports-sales',

        name: 'SalesReports',

        component: () =>
          import('@/views/template/reports/ReportsSalesView.vue'),

        meta: {
          role: [2]
        }
      },

      /* ========================================
         MANAGER
      ========================================= */

      {
        path: 'manager-home',

        name: 'ManagerHome',

        component: () =>
          import('@/views/manager/home/HomeManagerView.vue'),

        meta: {
          role: [3], title: 'Manager Home'
        }
      },

      {
        path: 'reports-manager',

        name: 'ManagerReports',

        component: () =>
          import('@/views/template/reports/ReportsManagerView.vue'),

        meta: {
          role: [3]
        }
      },

      {
        path: 'manager-executive-summary-report',

        name: 'Summary Report',

        component: () =>
          import('@/views/manager/executiveSummary/executiveSummaryView.vue'),

        meta: {
          role: [3]
        }
      },

      {
        path: 'manager-sales-performance-report',

        name: 'Sales Performance',

        component: () =>
          import('@/views/manager/salesPerformance/SalesPerformanceView.vue'),

        meta: {
          role: [3]
        }
      },


      {
        path: 'manager-follow-up-report',

        name: 'Follow Up Report',

        component: () =>
          import('@/views/manager/followUp/FollowUpReportView.vue'),

        meta: {
          role: [3]
        }
      },

      {
        path: 'manager-visit-report',

        name: 'Visit Report',

        component: () =>
          import('@/views/manager/visits/visitsView.vue'),

        meta: {
          role: [3]
        }
      },

      {
        path: 'manager-sales-pipeline-report',

        name: 'Sales Pipeline Report',

        component: () =>
          import('@/views/manager/salesPipeline/SalesPipelineView.vue'),

        meta: {
          role: [3]
        }
      },
      

      {
        path: 'manager-activity-report',

        name: 'Activity Report',

        component: () =>
          import('@/views/manager/activity/activityView.vue'),

        meta: {
          role: [3]
        }
      },

      {
        path: 'manager-customer-report',

        name: 'Customer Analytics',

        component: () =>
          import('@/views/manager/customers/customersView.vue'),

        meta: {
          role: [3]
        }
      },

      {
        path: 'manager-conversion-report',

        name: 'Conversion Analytics',

        component: () =>
          import('@/views/manager/conversion/conversionView.vue'),

        meta: {
          role: [3]
        }
      },

      {
        path: 'manager-lead-report',
        name: 'Lead Analytics',
        component: () =>
          import('@/views/manager/lead/leadView.vue'),
        meta: {
          role: [3]
        }
      },


      {
        path: 'manager-complaint-report',
        name: 'Complaint Analytics',
        component: () =>
          import('@/views/manager/complaint/complaintView.vue'),
        meta: {
          role: [3]
        }
      },

      {
        path: 'manager-potential-order-report',
        name: 'Potential Order Analytics',
        component: () =>
          import('@/views/manager/potensialOrder/potensialOrderView.vue'),
        meta: {
          role: [3]
        }
      },

      {
        path: 'manager-kpi-report',
        name: 'KPI Analytics',
        component: () =>
          import('@/views/manager/kpi/kpiView.vue'),
        meta: {
          role: [3]
        }
      },

      /* ========================================
         SHARED
      ========================================= */

      {
        path: 'profile',

        name: 'Profile',

        component: () =>
          import('@/views/global/profile/ProfileView.vue'),
      },

      {
        path: 'settings',

        name: 'Settings',

        component: () =>
          import('@/views/global/settings/SettingsView.vue'),
      },

      {
        path: 'table',

        name: 'Table',

        component: () =>
          import('@/views/template/table/TableView.vue'),
      },

      {
        path: 'table-with-components',

        name: 'TableWithComponents',

        component: () =>
          import('@/views/template/table/TableWithComponentsView.vue'),
      },

      {
        path: 'modal-demo',

        name: 'ModalDemo',

        component: () =>
          import('@/views/template/modal/ModalTemplateView.vue'),
      },
    ]
  },

  /* ========================================
     ERROR PAGE
  ========================================= */

  {
    path: '/unauthorized',

    name: 'Unauthorized',

    component: UnauthorizedView
  },

  {
    path: '/:pathMatch(.*)*',

    name: 'NotFound',

    component: NotFoundView
  }
]

const router = createRouter({

  history: createWebHistory(),

  routes,
})

/* ========================================
   ROUTER GUARD
======================================== */
// router/index.js
router.beforeEach((to, from) => {
  const authStore    = useAuthStore()
  const sidebarStore = useSidebarStore()
  const permissionStore = usePermissionStore()

  const publicPages = ['/login', '/register', '/forgot-password', '/home','/user-reset-password/', '/maps-tracking', '/history/monitoring/sales/data','/dashboard/all-data','/activity/feed']
  const authRequired = !publicPages.includes(to.path)

  //  Belum login → /login
  if (authRequired && !authStore.isLoggedIn) {
    return '/login'
  }

  //  Sudah login akses /login → dashboard sesuai role
  if (authStore.isLoggedIn && to.path === '/login') {
    const roleMap = {
      1: '/app/administrator-dashboard',
      2: '/app/sales-home',
      3: '/app/manager-home',
    }
    return roleMap[authStore.roleId] || '/app/administrator-dashboard'
  }

  //  Cek permission berdasarkan submenu URL yang user punya akses
  if (to.path.startsWith('/app/') && sidebarStore.sections.length) {

    // Kumpulkan semua URL yang boleh diakses user ini
    const allowedUrls = []

    sidebarStore.sections.forEach(section => {
      section.items.forEach(item => {
        if (item.to) allowedUrls.push(item.to)

        if (item.children) {
          item.children.forEach(child => {
            if (child.to) allowedUrls.push(child.to)
          })
        }
      })
    })

    // console.log('allowedUrls:', allowedUrls)
    // console.log('to.path:', to.path)

    // Halaman shared yang selalu boleh diakses
    const sharedPages = [
      '/app/profile',
      '/app/settings',
      '/app/unauthorized',
    ]

    if (
      !allowedUrls.includes(to.path) &&
      !sharedPages.includes(to.path)
    ) {
      return '/unauthorized'
    }
  }

  //  Cek permission berdasarkan URL
  if (to.path.startsWith('/app/')) {
    const sharedPages = ['/app/profile', '/app/settings', '/app/unauthorized']

    if (
      !sharedPages.includes(to.path) &&
      permissionStore.permissions &&
      Object.keys(permissionStore.permissions).length > 0 &&
      !permissionStore.isAllowed(to.path)
    ) {
      return '/unauthorized'
    }
  }


  return true
})
export default router