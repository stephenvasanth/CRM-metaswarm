package com.crm.domain.user;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    private User buildUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPassword("$2a$12$hashedpasswordvalue");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.USER);
        user.setActive(true);
        return user;
    }

    @Test
    void findByEmail_existingUser_returnsUser() {
        User user = buildUser("test@example.com");
        entityManager.persistAndFlush(user);

        Optional<User> found = userRepository.findByEmail("test@example.com");

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void findByEmail_unknownEmail_returnsEmpty() {
        Optional<User> found = userRepository.findByEmail("unknown@example.com");

        assertThat(found).isEmpty();
    }

    @Test
    void existsByEmail_existing_returnsTrue() {
        User user = buildUser("exists@example.com");
        entityManager.persistAndFlush(user);

        boolean exists = userRepository.existsByEmail("exists@example.com");

        assertThat(exists).isTrue();
    }

    @Test
    void existsByEmail_unknown_returnsFalse() {
        boolean exists = userRepository.existsByEmail("nobody@example.com");

        assertThat(exists).isFalse();
    }

    @Test
    void prePersist_setsCreatedAtAndUpdatedAt() {
        User user = buildUser("timestamps@example.com");
        User saved = entityManager.persistAndFlush(user);

        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void preUpdate_setsUpdatedAt() {
        User user = buildUser("update@example.com");
        User saved = entityManager.persistAndFlush(user);
        entityManager.clear();

        User found = userRepository.findById(saved.getId()).orElseThrow();
        found.setFirstName("Changed");
        userRepository.saveAndFlush(found);
        entityManager.clear();

        User updated = userRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getUpdatedAt()).isNotNull();
        assertThat(updated.getFirstName()).isEqualTo("Changed");
    }
}
