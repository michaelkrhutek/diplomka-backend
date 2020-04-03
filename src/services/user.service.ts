import { UserModel, IUserDoc } from "../models/user.model"
import { Error } from "mongoose";

export const getUserNameExists = async (
    userName: string
): Promise<boolean> => {
    const exists: boolean = await UserModel.exists({ userName });
    return exists;
}

export const getUser = async (
    id: string
): Promise<IUserDoc | null> => {
    const user: IUserDoc | null = await UserModel
        .findById(id)
        .select('-userName -password')
        .exec();
    return user;
}

export const getUserUsingByCredentials = async (
    username: string,
    password: string
): Promise<IUserDoc | null> => {
    const user: IUserDoc | null = await UserModel
        .findOne({ username, password })
        .select('-userName -password')
        .exec();
    return user;
}

export const createUser = async (
    displayName: string,
    username: string,
    password: string
): Promise<IUserDoc> => {
    if (await getUserNameExists(username)) {
        throw new Error('Uživatelské jméno už existuje');
    }
    const user: IUserDoc = await new UserModel({ displayName, username, password}).save()
    return user;
}