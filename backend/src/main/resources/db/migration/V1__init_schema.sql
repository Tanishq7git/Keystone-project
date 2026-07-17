-- ============================================================
-- Project KEYSTONE — core schema
-- ============================================================

CREATE TABLE customers (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    contact_email  VARCHAR(150),
    phone          VARCHAR(30),
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE sites (
    id             BIGSERIAL PRIMARY KEY,
    customer_id    BIGINT NOT NULL REFERENCES customers(id),
    name           VARCHAR(150) NOT NULL,
    address        VARCHAR(255),
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(20)  NOT NULL,
    customer_id    BIGINT REFERENCES customers(id),
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_users_role CHECK (role IN ('DISPATCHER','TECHNICIAN','MANAGER','CUSTOMER'))
);

CREATE TABLE parts (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    sku            VARCHAR(50)  NOT NULL UNIQUE,
    unit_cost      NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock_qty      INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_parts_stock CHECK (stock_qty >= 0)
);

CREATE TABLE work_orders (
    id             BIGSERIAL PRIMARY KEY,
    code           VARCHAR(30) NOT NULL UNIQUE,
    title          VARCHAR(200) NOT NULL,
    description    TEXT,
    priority       VARCHAR(20) NOT NULL,
    status         VARCHAR(20) NOT NULL,
    sla_due_at     TIMESTAMP,
    sla_breached   BOOLEAN NOT NULL DEFAULT FALSE,
    customer_id    BIGINT NOT NULL REFERENCES customers(id),
    site_id        BIGINT NOT NULL REFERENCES sites(id),
    assigned_to    BIGINT REFERENCES users(id),
    created_by     BIGINT REFERENCES users(id),
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now(),
    completed_at   TIMESTAMP,
    closed_at      TIMESTAMP,
    CONSTRAINT chk_wo_priority CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
    CONSTRAINT chk_wo_status CHECK (status IN ('NEW','ASSIGNED','IN_PROGRESS','ON_HOLD','COMPLETED','CLOSED','CANCELLED'))
);

CREATE TABLE work_order_status_history (
    id             BIGSERIAL PRIMARY KEY,
    work_order_id  BIGINT NOT NULL REFERENCES work_orders(id),
    from_status    VARCHAR(20),
    to_status      VARCHAR(20) NOT NULL,
    changed_by     BIGINT REFERENCES users(id),
    changed_at     TIMESTAMP NOT NULL DEFAULT now(),
    note           VARCHAR(500)
);

CREATE TABLE part_usage (
    id             BIGSERIAL PRIMARY KEY,
    work_order_id  BIGINT NOT NULL REFERENCES work_orders(id),
    part_id        BIGINT NOT NULL REFERENCES parts(id),
    qty_used       INTEGER NOT NULL,
    used_at        TIMESTAMP NOT NULL DEFAULT now(),
    logged_by      BIGINT REFERENCES users(id),
    CONSTRAINT chk_part_usage_qty CHECK (qty_used > 0)
);

CREATE TABLE time_logs (
    id             BIGSERIAL PRIMARY KEY,
    work_order_id  BIGINT NOT NULL REFERENCES work_orders(id),
    technician_id  BIGINT NOT NULL REFERENCES users(id),
    minutes        INTEGER NOT NULL,
    note           VARCHAR(500),
    logged_at      TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_time_log_minutes CHECK (minutes > 0)
);

CREATE TABLE notifications (
    id             BIGSERIAL PRIMARY KEY,
    target_role    VARCHAR(20),
    target_user_id BIGINT REFERENCES users(id),
    message        VARCHAR(500) NOT NULL,
    work_order_id  BIGINT REFERENCES work_orders(id),
    is_read        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_sites_customer          ON sites(customer_id);
CREATE INDEX idx_users_customer          ON users(customer_id);
CREATE INDEX idx_wo_status               ON work_orders(status);
CREATE INDEX idx_wo_customer             ON work_orders(customer_id);
CREATE INDEX idx_wo_site                 ON work_orders(site_id);
CREATE INDEX idx_wo_assigned             ON work_orders(assigned_to);
CREATE INDEX idx_wo_sla_due              ON work_orders(sla_due_at);
CREATE INDEX idx_wo_history_wo           ON work_order_status_history(work_order_id);
CREATE INDEX idx_part_usage_wo           ON part_usage(work_order_id);
CREATE INDEX idx_time_logs_wo            ON time_logs(work_order_id);
CREATE INDEX idx_notifications_role      ON notifications(target_role);
CREATE INDEX idx_notifications_user      ON notifications(target_user_id);
