# social-scheduler

- `social-scheduler` never generates creatives (`AUTO_GENERATE_CREATIVES = false`: no auto-render, no queue refill); rows must carry finished media before they are due; why: the owner makes all social media outside (Kling) and Lovable AI credits must not be spent on posts.
- Organic Instagram/Facebook stats are read through the admin-only, read-only `insights` action of `social-scheduler`, using the scheduler's stored Page token; why: the Meta Ads connector lacks Instagram insights permission.
