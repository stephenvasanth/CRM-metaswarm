package com.crm.domain.user;

import com.crm.domain.user.dto.CreateUserRequest;
import com.crm.domain.user.dto.UpdateProfileRequest;
import com.crm.domain.user.dto.UpdateUserRequest;
import com.crm.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User activeUser;
    private User inactiveUser;

    @BeforeEach
    void setUp() {
        activeUser = new User();
        activeUser.setId(1L);
        activeUser.setEmail("active@example.com");
        activeUser.setPassword("$2a$12$encodedpassword");
        activeUser.setFirstName("Active");
        activeUser.setLastName("User");
        activeUser.setRole(Role.USER);
        activeUser.setActive(true);

        inactiveUser = new User();
        inactiveUser.setId(2L);
        inactiveUser.setEmail("inactive@example.com");
        inactiveUser.setPassword("$2a$12$encodedpassword");
        inactiveUser.setFirstName("Inactive");
        inactiveUser.setLastName("User");
        inactiveUser.setRole(Role.USER);
        inactiveUser.setActive(false);
    }

    @Test
    void loadUserByUsername_existingActiveUser_returnsUserDetails() {
        when(userRepository.findByEmail("active@example.com")).thenReturn(Optional.of(activeUser));

        UserDetails userDetails = userService.loadUserByUsername("active@example.com");

        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("active@example.com");
    }

    @Test
    void loadUserByUsername_unknownEmail_throwsUsernameNotFoundException() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.loadUserByUsername("unknown@example.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void loadUserByUsername_inactiveUser_throwsUsernameNotFoundException() {
        when(userRepository.findByEmail("inactive@example.com")).thenReturn(Optional.of(inactiveUser));

        assertThatThrownBy(() -> userService.loadUserByUsername("inactive@example.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void createUser_newEmail_savesWithBCryptPassword() {
        CreateUserRequest request = new CreateUserRequest(
                "new@example.com", "Password1!", "New", "User", Role.USER);

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password1!")).thenReturn("$2a$12$encodednewpassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(3L);
            return u;
        });

        User created = userService.createUser(request);

        assertThat(created.getEmail()).isEqualTo("new@example.com");
        assertThat(created.getPassword()).isEqualTo("$2a$12$encodednewpassword");
        assertThat(created.getPassword()).doesNotContain("Password1!");
        verify(passwordEncoder).encode("Password1!");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_duplicateEmail_throwsIllegalArgumentException() {
        CreateUserRequest request = new CreateUserRequest(
                "active@example.com", "Password1!", "Other", "User", Role.USER);

        when(userRepository.existsByEmail("active@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("email");
    }

    @Test
    void updateUser_changesRoleAndActive() {
        UpdateUserRequest request = new UpdateUserRequest(Role.ADMIN, false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User updated = userService.updateUser(1L, request);

        assertThat(updated.getRole()).isEqualTo(Role.ADMIN);
        assertThat(updated.isActive()).isFalse();
    }

    @Test
    void updateProfile_updatesNameAndPassword() {
        UpdateProfileRequest request = new UpdateProfileRequest("NewFirst", "NewLast", "NewPass1!");

        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.encode("NewPass1!")).thenReturn("$2a$12$encodednewpassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User updated = userService.updateProfile(1L, request);

        assertThat(updated.getFirstName()).isEqualTo("NewFirst");
        assertThat(updated.getLastName()).isEqualTo("NewLast");
        assertThat(updated.getPassword()).isEqualTo("$2a$12$encodednewpassword");
        verify(passwordEncoder).encode("NewPass1!");
    }

    @Test
    void updateProfile_passwordTooShort_throwsException() {
        UpdateProfileRequest request = new UpdateProfileRequest("First", "Last", "short");

        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> userService.updateProfile(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("8");
    }

    @Test
    void findById_notFound_throwsResourceNotFoundException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findAll_returnsAllUsers() {
        when(userRepository.findAll()).thenReturn(List.of(activeUser, inactiveUser));

        List<User> users = userService.findAll();

        assertThat(users).hasSize(2);
    }

    @Test
    void findByEmail_existingUser_returnsUser() {
        when(userRepository.findByEmail("active@example.com")).thenReturn(Optional.of(activeUser));

        User found = userService.findByEmail("active@example.com");

        assertThat(found.getEmail()).isEqualTo("active@example.com");
    }

    @Test
    void findByEmail_notFound_throwsResourceNotFoundException() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findByEmail("missing@example.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createUser_withNullRole_defaultsToUser() {
        CreateUserRequest request = new CreateUserRequest(
                "new@example.com", "Password1!", "New", "User", null);

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$encodednewpassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(3L);
            return u;
        });

        User created = userService.createUser(request);

        assertThat(created.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void updateProfile_withNullFields_doesNotChangeExistingValues() {
        UpdateProfileRequest request = new UpdateProfileRequest(null, null, null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User updated = userService.updateProfile(1L, request);

        assertThat(updated.getFirstName()).isEqualTo("Active");
        assertThat(updated.getLastName()).isEqualTo("User");
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void updateUser_withNullFields_doesNotChangeExistingValues() {
        UpdateUserRequest request = new UpdateUserRequest(null, null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User updated = userService.updateUser(1L, request);

        assertThat(updated.getRole()).isEqualTo(Role.USER);
        assertThat(updated.isActive()).isTrue();
    }

    @Test
    void user_setterGetterCoverage() {
        // Covers setUpdatedAt/getUpdatedAt accessors for 100% line coverage
        java.time.Instant now = java.time.Instant.now();
        User user = new User();
        user.setUpdatedAt(now);
        assertThat(user.getUpdatedAt()).isEqualTo(now);
    }
}
