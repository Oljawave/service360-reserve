import { createRouter, createWebHistory } from 'vue-router'
import ServicedObjects from '@/views/ServicedObjects.vue'
import Sections from '@/views/Sections.vue'
import Stations from '@/views/Stations.vue'
import Stages from '@/views/Stages.vue'
import OrgStructure from '@/views/OrgStructure.vue'
import Login from '@/views/Login.vue'
import Welcome from '@/views/Welcome.vue'
import Tools from '@/views/Tools.vue'
import Equipment from '@/views/Equipment.vue'
import Materials from '@/views/Materials.vue'
import ThirdPartyServices from '@/views/ThirdPartyServices.vue'
import Personnel from '@/views/Personnel.vue'
import Clients from '@/views/Clients.vue'
import Services from '@/views/Services.vue'
import PassportData from '@/views/PassportData.vue'
import Profile from '@/views/Profile.vue'
import Materials1C from '@/views/Materials1C.vue'
import Services1C from '@/views/Services1C.vue'
import { isAuthenticated } from '@/shared/api/auth/auth'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/main',
    name: 'Welcome',
    component: Welcome,
    meta: { requiresAuth: true }
  },
  {
    path: '/objects',
    name: 'ServicedObjects',
    component: ServicedObjects,
    meta: { requiresAuth: true }
  },
  {
    path: '/sections',
    name: 'Sections',
    component: Sections,
    meta: { requiresAuth: true }
  },
  {
    path: '/stations',
    name: 'Stations',
    component: Stations,
    meta: { requiresAuth: true }
  },
  {
    path: '/stages',
    name: 'Stages',
    component: Stages,
    meta: { requiresAuth: true }
  },
  {
    path: '/resources/tools',
    name: 'Tools',
    component: Tools,
    meta: { requiresAuth: true }
  },
  {
    path: '/resources/equipment',
    name: 'Equipment',
    component: Equipment,
    meta: { requiresAuth: true }
  },
  {
    path: '/resources/materials',
    name: 'Materials',
    component: Materials,
    meta: { requiresAuth: true }
  },
  {
    path: '/resources/thirdparty-services',
    name: 'ThirdPartyServices',
    component: ThirdPartyServices,
    meta: { requiresAuth: true }
  },
  {
    path: '/services',
    name: 'Services',
    component: Services,
    meta: { requiresAuth: true }
  },
  {
    path: '/organization',
    name: 'OrgStructure',
    component: OrgStructure,
    meta: { requiresAuth: true }
  },
  {
    path: '/personnel',
    name: 'Personnel',
    component: Personnel,
    meta: { requiresAuth: true }
  },
  {
    path: '/clients',
    name: 'Clients',
    component: Clients,
    meta: { requiresAuth: true }
  },
  {
    path: '/objects/:id/passport',
    name: 'PassportData',
    component: PassportData,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/1c/materials',
    name: 'Materials1C',
    component: Materials1C,
    meta: { requiresAuth: true }
  },
  {
    path: '/1c/services',
    name: 'Services1C',
    component: Services1C,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory('/dtj/org/'),
  routes
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const authenticated = isAuthenticated()

  if (requiresAuth && !authenticated) {
    next('/login')
  } else if (to.path === '/login' && authenticated) {
    next('/main')
  } else {
    next()
  }
})

export default router
