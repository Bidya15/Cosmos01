package com.cosmos.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "spaces")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Space {

    @Id
    private String id; // e.g. "office-1", "engineering", "cafeteria"

    @Column(nullable = false)
    private String name; // e.g. "Main Office", "Engineering Hub"

    @Column
    private String description;

    @Column
    private int capacity = 50;

    @Column
    private int width = 2400;

    @Column
    private int height = 1800;

    @Column
    private String backgroundType; // e.g. "grid", "stars", "nebula"
}
