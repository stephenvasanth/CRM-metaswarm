package com.crm.domain.activity;

import com.crm.domain.contact.Contact;
import com.crm.domain.deal.Deal;
import com.crm.domain.user.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private ActivityType type;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id")
    private Deal deal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Activity() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.occurredAt == null) {
            this.occurredAt = this.createdAt;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ActivityType getType() { return type; }
    public void setType(ActivityType type) { this.type = type; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }

    public Contact getContact() { return contact; }
    public void setContact(Contact contact) { this.contact = contact; }

    public Deal getDeal() { return deal; }
    public void setDeal(Deal deal) { this.deal = deal; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
