package com.crm.domain.user;

import com.crm.domain.user.dto.CreateUserRequest;
import com.crm.domain.user.dto.UpdateProfileRequest;
import com.crm.domain.user.dto.UpdateUserRequest;
import com.crm.exception.ResourceNotFoundException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        if (!user.isActive()) {
            throw new UsernameNotFoundException("User account is inactive: " + email);
        }

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                .build();
    }

    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("A user with this email already exists");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRole(request.role() != null ? request.role() : Role.USER);
        user.setActive(true);

        return userRepository.save(user);
    }

    public User updateUser(Long id, UpdateUserRequest request) {
        User user = findById(id);

        if (request.role() != null) {
            user.setRole(request.role());
        }
        if (request.active() != null) {
            user.setActive(request.active());
        }

        return userRepository.save(user);
    }

    public User updateProfile(Long id, UpdateProfileRequest request) {
        User user = findById(id);

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.password() != null) {
            if (request.password().length() < 8) {
                throw new IllegalArgumentException("Password must be at least 8 characters");
            }
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        return userRepository.save(user);
    }
}
