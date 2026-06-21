package com.crm.domain.tag;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "tags")
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "colour", nullable = false)
    private String colour;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Tag() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.colour == null) {
            this.colour = "#6366F1";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getColour() {
        return colour;
    }

    public void setColour(String colour) {
        this.colour = colour;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
