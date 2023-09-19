import envHandler from '../managers/envHandler';
import catchAsync from '../managers/catchAsync';
import { Request, Response, NextFunction } from "express";
import axios from 'axios';
import logger from '../../logs/logger';
import difficultyFind from '../helpers/difficultyFind';
import Issue, { IssueInterface } from '../models/issueModel';
import User, { UserInterface } from '../models/userModel';
import difficultyScore from '../helpers/difficultyScore';

export const webhookController = catchAsync(
    async (req: Request, res:Response, next: NextFunction) => {

    const eventType = req.headers['x-github-event'];
    
    if (eventType === 'pull_request' && req.body.action === 'closed' && req.body.pull_request.merged) {
      const username = req.body.pull_request.user.login;
      const user: UserInterface = await User.findOne({githubUsername: username})
      if (!user){
        logger.error(`User ${req.body.user.login} not found`);
        return res.status(404).json({"success":false, "message":"User not found"});
    }
      const title = req.body.pull_request.title;
      const regex = /fixes #(\d+)/i;
      const match = title.match(regex);
      if(!match){
        logger.error("No match found in PR title");
        return res.json({message: "No match found in PR title"}).status(400);
      }
      const issueresponse = await axios.get(`${req.body.repository.url}/issues/${match[1]}`);
      const issuedata = issueresponse.data;
      const issuePayload = {
        repo: issuedata.repository_url,
        title: issuedata.title,
        difficulty: difficultyFind(issuedata.labels)
    }
    const newIssue: IssueInterface = new Issue(issuePayload);
    await newIssue.save();

    user.Issues.push(newIssue._id);

    let newscore:number = user.score;

    newscore = newscore + difficultyScore(issuePayload.difficulty);

    user.score = newscore;
    console.log(user);
    logger.info(`User ${username} has scored ${user.score} points`);
    await user.save();
    return res.status(200).json({"success":true});

    } else {
      return res.json({message: "No match found in PR title"}).status(400);
    }
})

  