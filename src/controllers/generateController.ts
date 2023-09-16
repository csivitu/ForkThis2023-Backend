import catchAsync from "../managers/catchAsync.js"
import {Request, Response, NextFunction } from 'express';
import User from "../models/userModel.js";
import Issue from "../models/issueModel.js";
// import PR from "../models/prModel.js";
import { faker } from '@faker-js/faker';
import difficultyScore from "../helpers/difficultyScore.js";
import envHandler from "../managers/envHandler.js";

export const generateController = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const {auth} = req.body;
        if (auth !== envHandler("GENERATOR_SECRET")){
            return res.status(401).json({
                status: "fail",
                message: "Unauthorized"
            })
        }
        const issueIDs = [];
        const difficultyArr = ["easy", "medium" , "hard" , "expert"]
        let score  = 0;
        for(let i = 0; i < 10; i ++){
            const issuePayload = {
                repo : faker.internet.url(),
                title: faker.lorem.sentence(),
                difficulty: difficultyArr[Math.floor(Math.random() * 4) + 1]
            }
            score = score + difficultyScore(issuePayload.difficulty);
            const newIssue = await new Issue(issuePayload).save();
            issueIDs.push(newIssue._id);
        }
        const userPayload = {
            githubUsername: faker.internet.userName(),
            name: faker.person.fullName(),
            score: score,
            Issues: issueIDs,
            id: faker.string.uuid(),
        }
        const newUser = await new User(userPayload).save();
        res.status(200).json({
            status: "success",
            data: {
                newUser
            }
        })
})
