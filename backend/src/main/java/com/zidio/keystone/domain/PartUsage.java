package com.zidio.keystone.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "part_usage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "part_id", nullable = false)
    private Part part;

    @Column(name = "qty_used", nullable = false)
    private int qtyUsed;

    @Column(name = "used_at", nullable = false, updatable = false)
    private LocalDateTime usedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logged_by")
    private User loggedBy;

    @PrePersist
    void prePersist() {
        if (usedAt == null) {
            usedAt = LocalDateTime.now();
        }
    }
}
