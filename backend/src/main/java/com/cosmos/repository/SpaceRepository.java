package com.cosmos.repository;

import com.cosmos.model.Space;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpaceRepository extends JpaRepository<Space, String> {
}
