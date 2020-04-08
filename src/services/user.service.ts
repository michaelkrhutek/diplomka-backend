import { UserModel, IUserDoc } from "../models/user.model"
import { Error } from "mongoose";



export const getUserNameExists = async (
    username: string
): Promise<boolean> => {
    const exists: boolean = await UserModel.exists({ username });
    return exists;
}



export const getDisplayNameExists = async (
    displayName: string
): Promise<boolean> => {
    const exists: boolean = await UserModel.exists({ displayName });
    return exists;
}



export const getUser = async (
    id: string
): Promise<IUserDoc | null> => {
    const user: IUserDoc | null = await UserModel
        .findById(id)
        .select('-username -password')
        .exec();
    return user;
}



export const getUserUsingByCredentials = async (
    username: string,
    password: string
): Promise<IUserDoc | null> => {
    const user: IUserDoc | null = await UserModel
        .findOne({ username, password })
        .select('-username -password')
        .exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání uživatele');
        });
    return user;
}



export const getUsers = async (filterText: string) => {
    const users: IUserDoc[] = await UserModel
        .find({
            displayNameLowerCased: { "$regex": filterText.toLowerCase(), "$options": "i" }
        })
        .limit(50)
        .select('-username -password')
        .exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání uživatelů');
        });
    return users;
}



export const createUser = async (
    displayName: string,
    username: string,
    password: string
): Promise<IUserDoc> => {
    if (await getUserNameExists(username)) {
        throw new Error('Přihlašovací jméno už existuje');
    }
    if (await getDisplayNameExists(displayName)) {
        throw new Error('Jméno k zobrazení už existuje');
    }
    const user: IUserDoc = await new UserModel({ displayName, username, password }).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při ukládání uživatele');
        });
    return user;
}