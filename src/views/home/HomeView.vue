<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const mobileMenu = ref(false)

const stats = [
  {
    label: 'Total Leads',
    value: '128',
    icon: 'user-plus',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    label: 'Total Customers',
    value: '64',
    icon: 'users',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
  },
  {
    label: 'Visits Today',
    value: '24',
    icon: 'map-pin',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
  },
  {
    label: 'Deals Closed',
    value: '12',
    icon: 'handshake',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
]

const features = [
  {
    icon: 'user-plus',
    title: 'Lead Management',
    desc: 'Track and manage all your potential leads in one place efficiently.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    icon: 'users',
    title: 'Customer Management',
    desc: 'Keep all customer data organized and accessible at any time.',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
  },
  {
    icon: 'map-pin',
    title: 'Visit Tracking',
    desc: 'Monitor your sales team field visits with real-time GPS tracking.',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
  },
  {
    icon: 'chart-bar',
    title: 'Sales Analytics',
    desc: 'Visualize your sales performance with interactive charts and reports.',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
  },
  {
    icon: 'message',
    title: 'Team Collaboration',
    desc: 'Assign tasks and collaborate seamlessly across your sales team.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    icon: 'arrow-trend-up',
    title: 'Deal Pipeline',
    desc: 'Manage your deals through every stage of the sales pipeline.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
  },
]
</script>

<template>
  <div class="lp">

    <!-- NAVBAR -->
    <nav class="lp-nav">

      <div class="lp-nav-inner">

        <!-- BRAND -->
        <!-- <div class="lp-brand">

          <div class="lp-logo">
            <font-awesome-icon icon="chart-line" />
          </div>

          <span class="lp-brand-name">
            PT. Duta Indomandiri
          </span>

        </div> -->
       <div class="lp-brand">
  <img src="/logo.png" alt="Logo" class="logo-img" />
  <span class="lp-brand-name">
    PT. Duta Indomandiri
  </span>
</div>

        <!-- MOBILE BUTTON -->
        <button
          class="lp-mobile-toggle"
          @click="mobileMenu = !mobileMenu"
        >
          <font-awesome-icon icon="bars" />
        </button>

        <!-- MENU -->
        <div
          class="lp-nav-links"
          :class="{ open: mobileMenu }"
        >

          <a href="#" class="lp-link active">
            <font-awesome-icon icon="house" />
            Home
          </a>

          <a href="#features" class="lp-link">
            <font-awesome-icon icon="star" />
            Features
          </a>

          <a href="#" class="lp-link">
            <font-awesome-icon icon="chart-bar" />
            Dashboard
          </a>

          <a href="#" class="lp-link">
            <font-awesome-icon icon="bell" />
            Activity Feed
          </a>

          <!-- MOBILE RIGHT -->
          <div class="lp-nav-right">

            <div class="lp-search">

              <font-awesome-icon
                icon="magnifying-glass"
                class="lp-search-icon"
              />

              <input
                type="text"
                placeholder="Search..."
                class="lp-search-input"
              />

            </div>

            <button
              class="lp-btn-login"
              @click="router.push('/login')"
            >
              <font-awesome-icon icon="right-to-bracket" />
              Login
            </button>

          </div>

        </div>

      </div>

    </nav>

    <!-- HERO -->
    <section class="lp-hero">

      <div class="lp-hero-inner">

        <div class="lp-hero-text">

          <h1 class="lp-hero-title">
            Welcome to CRM Application!
            <span class="lp-hero-emoji">🎉</span>
          </h1>

          <p class="lp-hero-desc">
            Manage customers, monitor sales activity,
            and increase your team's productivity
            with ease. Start your CRM journey now!
          </p>

          <button
            class="lp-btn-start"
            @click="router.push('/login')"
          >
            Login Now
          </button>

        </div>

       
            <img
              src="/images/man-with-laptop-light.png"
              alt="CRM Illustration"
              class="lp-hero-image"
            />
         

        

      </div>

    </section>

    <!-- STATS -->
    <section class="lp-stats">

      <div class="lp-stats-inner">

        <div
          v-for="stat in stats"
          :key="stat.label"
          class="lp-stat-card"
        >

          <div
            class="lp-stat-icon"
            :style="{
              background: stat.bg,
              color: stat.color
            }"
          >
            <font-awesome-icon :icon="stat.icon" />
          </div>

          <div class="lp-stat-info">

            <div class="lp-stat-label">
              {{ stat.label }}
            </div>

            <div class="lp-stat-value">
              {{ stat.value }}
            </div>

          </div>

        </div>

      </div>

    </section>

    <!-- FEATURES -->
    <section
      id="features"
      class="lp-features"
    >

      <div class="lp-features-inner">

        <div class="lp-section-label">
          What You Can Do
        </div>

        <div class="lp-features-grid">

          <div
            v-for="feat in features"
            :key="feat.title"
            class="lp-feat-card"
          >

            <div
              class="lp-feat-icon"
              :style="{
                background: feat.bg,
                color: feat.color
              }"
            >
              <font-awesome-icon :icon="feat.icon" />
            </div>

            <div class="lp-feat-title">
              {{ feat.title }}
            </div>

            <div class="lp-feat-desc">
              {{ feat.desc }}
            </div>

          </div>

        </div>

      </div>

    </section>

    <!-- FOOTER -->
    <footer class="lp-footer">

      <div class="lp-footer-inner">

        <span class="lp-footer-copy">
         © 2026 PT. Duta Indomandiri. All rights reserved.
        </span>

        <div class="lp-footer-links">

          <a href="#" class="lp-footer-link">
            More Information
          </a>

          <a href="#" class="lp-footer-link">
            Documentation & Support
          </a>

        </div>

      </div>

    </footer>

  </div>
</template>

<style scoped>

/* BASE */
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

.lp{
  min-height:100vh;
  background:#f1f5f9;
  font-family:'Segoe UI',system-ui,sans-serif;
  overflow-x:hidden;
}

/* NAVBAR */
.lp-nav{
  background:#fff;
  border-bottom:1px solid #e5e7eb;
  position:sticky;
  top:0;
  z-index:100;
}

.lp-nav-inner{
  max-width:1440px;
  margin:0 auto;
  padding:12px 24px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
  flex-wrap:wrap;
}

.lp-brand{
  display:flex;
  align-items:center;
  gap:10px;
}

.lp-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-img {
  width: 66px;
  height: 66px;
  object-fit: contain;
}

.lp-brand-name {
  font-weight: 800;
  font-size: .95rem;
  letter-spacing: .05em;
  white-space: nowrap;
}

.logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 10px;
}

.lp-brand-name{
  font-weight:800;
  font-size:.95rem;
  letter-spacing:.05em;
}

/* MOBILE BUTTON */
.lp-mobile-toggle{
  display:none;
  width:42px;
  height:42px;
  border:none;
  border-radius:10px;
  background:#f3f4f6;
  cursor:pointer;
  font-size:1rem;
  color:#111827;
  align-items:center;
  justify-content:center;
}

/* NAV LINKS */
.lp-nav-links{
  display:flex;
  align-items:center;
  justify-content:space-between;
  flex:1;
  gap:20px;
}

.lp-link{
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:9px 14px;
  border-radius:10px;
  text-decoration:none;
  color:#4b5563;
  font-size:.9rem;
  font-weight:500;
  transition:.2s;
}

.lp-link:hover{
  background:#f3f4f6;
}

.lp-link.active{
  background:rgba(99,102,241,.1);
  color:#6366f1;
  font-weight:700;
}

.lp-nav-right{
  display:flex;
  align-items:center;
  gap:12px;
}

.lp-search{
  position:relative;
}

.lp-search-icon{
  position:absolute;
  left:12px;
  top:50%;
  transform:translateY(-50%);
  color:#9ca3af;
  font-size:.8rem;
}

.lp-search-input{
  padding:10px 14px 10px 34px;
  border:1px solid #e5e7eb;
  border-radius:10px;
  outline:none;
  width:200px;
  background:#f9fafb;
}

.lp-btn-login{
  border:none;
  background:#6366f1;
  color:#fff;
  padding:10px 18px;
  border-radius:10px;
  font-weight:700;
  display:flex;
  align-items:center;
  gap:8px;
  cursor:pointer;
}

.lp-btn-login:hover{
  background:#4f46e5;
}

/* HERO */
.lp-hero{
  max-width:1440px;
  margin:0 auto;
  padding:24px;
}

.lp-hero-inner{
  background:linear-gradient(
    135deg,
    #eef2ff,
    #e0f2fe
  );

  border-radius:22px;
  padding:clamp(24px,4vw,48px);

  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:40px;
  flex-wrap:wrap;
}

.lp-hero-text{
  flex:1 1 420px;
}

.lp-hero-title{
  font-size:clamp(2rem,4vw,3rem);
  color:#4338ca;
  font-weight:800;
  margin-bottom:14px;
}

.lp-hero-desc{
  color:#4b5563;
  line-height:1.8;
  margin-bottom:24px;
  max-width:620px;
}

.lp-btn-start{
  border:none;
  background:#6366f1;
  color:#fff;
  padding:13px 26px;
  border-radius:12px;
  font-weight:700;
  cursor:pointer;
}

.lp-btn-start:hover{
  background:#4f46e5;
}

/* ILLUSTRATION */
.lp-hero-illus{
  flex:1 1 260px;
  min-height:220px;
  display:flex;
  align-items:center;
  justify-content:center;
  position:relative;
}

.illus-circle{
  width:180px;
  height:180px;
  border-radius:50%;
  border:2px dashed rgba(99,102,241,.3);
  background:rgba(99,102,241,.08);
  position:absolute;
}

.person-head{
  width:52px;
  height:52px;
  margin:0 auto -4px;
  position:relative;
}

.person-face{
  width:100%;
  height:100%;
  border-radius:50%;
  background:#fbbf24;
}

.person-hair{
  position:absolute;
  top:-4px;
  left:6px;
  right:6px;
  height:22px;
  background:#1f2937;
  border-radius:50% 50% 0 0;
}

.person-body{
  width:90px;
  height:72px;
  background:#6366f1;
  border-radius:14px 14px 0 0;
  display:flex;
  align-items:center;
  justify-content:center;
}

.person-laptop{
  width:62px;
  height:42px;
  background:#111827;
  border-radius:5px;
  padding:4px;
}

.laptop-screen{
  width:100%;
  height:100%;
  background:#1e293b;
  border-radius:3px;
  padding:4px;
  display:flex;
  flex-direction:column;
  gap:3px;
}

.screen-bar{
  height:4px;
  border-radius:2px;
  background:#6366f1;
}

.screen-bar.short{
  width:60%;
}

.float-ring{
  position:absolute;
  top:16px;
  right:40px;
  width:30px;
  height:30px;
  border-radius:50%;
  border:3px solid #6366f1;
  opacity:.4;
}

.float-plant{
  position:absolute;
  right:0;
  bottom:0;
  font-size:2rem;
}

/* STATS */
.lp-stats{
  max-width:1440px;
  margin:0 auto;
  padding:0 24px 24px;
}

.lp-stats-inner{
  display:grid;
  grid-template-columns:repeat(
    auto-fit,
    minmax(220px,1fr)
  );
  gap:18px;
}

.lp-stat-card{
  background:#fff;
  border-radius:18px;
  padding:22px;
  display:flex;
  align-items:center;
  gap:16px;
  border:1px solid #e5e7eb;
}

.lp-stat-icon{
  width:54px;
  height:54px;
  border-radius:14px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:1.2rem;
}

.lp-stat-label{
  font-size:.88rem;
  color:#6b7280;
  margin-bottom:4px;
}

.lp-stat-value{
  font-size:2rem;
  font-weight:800;
}

/* FEATURES */
.lp-features{
  max-width:1440px;
  margin:0 auto;
  padding:0 24px 40px;
}

.lp-section-label{
  font-size:1.2rem;
  font-weight:800;
  margin-bottom:20px;
}

.lp-features-grid{
  display:grid;
  grid-template-columns:repeat(
    auto-fit,
    minmax(260px,1fr)
  );
  gap:20px;
}

.lp-feat-card{
  background:#fff;
  border-radius:18px;
  padding:24px;
  border:1px solid #e5e7eb;
  transition:.2s;
}

.lp-feat-card:hover{
  transform:translateY(-4px);
  box-shadow:0 10px 24px rgba(0,0,0,.06);
}

.lp-feat-icon{
  width:54px;
  height:54px;
  border-radius:14px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:1.2rem;
  margin-bottom:16px;
}

.lp-feat-title{
  font-size:1rem;
  font-weight:800;
  margin-bottom:8px;
}

.lp-feat-desc{
  color:#6b7280;
  line-height:1.7;
  font-size:.92rem;
}

/* FOOTER */
.lp-footer{
  background:#fff;
  border-top:1px solid #e5e7eb;
  padding:20px 24px;
}

.lp-footer-inner{
  max-width:1440px;
  margin:0 auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  flex-wrap:wrap;
  gap:16px;
}

.lp-footer-copy{
  color:#6b7280;
  font-size:.9rem;
}

.lp-footer-links{
  display:flex;
  gap:20px;
  flex-wrap:wrap;
}

.lp-footer-link{
  color:#6b7280;
  text-decoration:none;
  font-size:.9rem;
}

.lp-footer-link:hover{
  color:#6366f1;
}

.lp-hero-image{
  width:100%;
  max-width:420px;
  height:auto;
  object-fit:contain;
}

.lp-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* hapus baris background gradient */
}

/* MOBILE */
@media (max-width:768px){

  .lp-mobile-toggle{
    display:flex;
  }

  .lp-nav-links{
    width:100%;
    display:none;
    flex-direction:column;
    align-items:stretch;
    gap:10px;
    padding-top:14px;
  }

  .lp-nav-links.open{
    display:flex;
  }

  .lp-link{
    width:100%;
    background:#f9fafb;
  }

  .lp-nav-right{
    width:100%;
    flex-direction:column;
    align-items:stretch;
  }

  .lp-search{
    width:100%;
  }

  .lp-search-input{
    width:100%;
  }

  .lp-btn-login{
    width:100%;
    justify-content:center;
  }

  .lp-hero{
    padding:16px;
  }

  .lp-hero-inner{
    text-align:center;
  }

  .lp-hero-desc{
    margin-left:auto;
    margin-right:auto;
  }

  .lp-stats{
    padding:0 16px 16px;
  }

  .lp-features{
    padding:0 16px 24px;
  }

  .lp-footer-inner{
    flex-direction:column;
    text-align:center;
  }

}

</style>