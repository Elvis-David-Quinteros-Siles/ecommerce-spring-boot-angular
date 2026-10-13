package com.icodeap.ecommerce.backend.application;

import com.icodeap.ecommerce.backend.domain.model.User;
import com.icodeap.ecommerce.backend.domain.model.UserType;
import com.icodeap.ecommerce.backend.domain.port.IUserRepository;

public class RegistrationService {
    private final IUserRepository iUserRepository;

    public RegistrationService(IUserRepository iUserRepository) {
        this.iUserRepository = iUserRepository;
    }

    // El registro publico siempre crea un cliente nuevo: no permite elegir rol
    // ni enviar un id (que sobrescribiria una cuenta existente)
    public User register (User user){
        user.setId(null);
        user.setUserType(UserType.USER);
        return iUserRepository.save(user);
    }
}
